import { Agent } from "@mastra/core/agent";
import { z } from "zod";

import {
  EMOTION_SYNONYMS,
  EmotionTone,
  MAX_TURNS,
  PERSONA_PROFILES,
  PersonaId,
} from "../../data/personas";
import {
  ConversationRequestInput,
  ConversationResult,
  ConversationTurn,
} from "../types/conversation";
import {
  formatConversationHistory,
  formatKnowledgeForPrompt,
  retrievePersonaKnowledge,
} from "../utils/persona-knowledge";
import { synthesizeElevenLabsSpeech } from "../utils/elevenlabs-client";
import { reisenAgent } from "../agents/reisen-agent";
import { sannoAgent } from "../agents/sanno-agent";

const agentResponseSchema = z.object({
  text: z
    .string()
    .min(1)
    .max(200, "テキストは200文字以内に収めてください。"),
  emotion: z.string(),
  shouldEnd: z.boolean().default(false),
  reasoning: z
    .string()
    .min(1)
    .max(200, "reasoningは200文字以内にしてください。"),
  focus: z.string().nullable().optional(),
  closingSummary: z.string().nullable().optional(),
});

const AGENT_MAP: Record<PersonaId, Agent> = {
  reisen: reisenAgent,
  sanno: sannoAgent,
};

const PERSONA_ORDER: PersonaId[] = ["reisen", "sanno"];

const coerceEmotion = (emotion: string, personaId: PersonaId): EmotionTone => {
  if (!emotion) {
    return PERSONA_PROFILES[personaId].defaults.emotion;
  }

  const normalized = emotion.toLowerCase().trim();
  if (normalized in EMOTION_SYNONYMS) {
    return normalized as EmotionTone;
  }

  const synonymEntry = Object.entries(EMOTION_SYNONYMS).find(([, synonyms]) =>
    synonyms.some((synonym) => synonym.toLowerCase() === normalized)
  );

  if (synonymEntry) {
    return synonymEntry[0] as EmotionTone;
  }

  return PERSONA_PROFILES[personaId].defaults.emotion;
};

export const runConversation = async ({
  topic,
  maxTurns = MAX_TURNS,
}: ConversationRequestInput): Promise<ConversationResult> => {
  const boundedTurns = Math.min(maxTurns, MAX_TURNS);
  const turns: ConversationTurn[] = [];
  let summary: string | undefined;
  let endedBy: PersonaId = "sanno";

  for (let index = 0; index < boundedTurns; index++) {
    const personaId = PERSONA_ORDER[index % PERSONA_ORDER.length];
    const agent = AGENT_MAP[personaId];
    const profile = PERSONA_PROFILES[personaId];
    const partnerId = personaId === "reisen" ? "sanno" : "reisen";
    const partnerProfile = PERSONA_PROFILES[partnerId];

    const historyText = formatConversationHistory(
      turns.map(
        (turn) => `${PERSONA_PROFILES[turn.speaker].name}: ${turn.text}`
      )
    );

    const retrievalSnippets = retrievePersonaKnowledge({
      personaId,
      topic,
      historyTexts: turns.map((turn) => turn.text),
      maxResults: 3,
    });

    const knowledgePrompt = formatKnowledgeForPrompt(retrievalSnippets);

    const turnPrompt = buildTurnPrompt({
      topic,
      personaId,
      personaLabel: profile.name,
      partnerLabel: partnerProfile.name,
      turnIndex: index + 1,
      maxTurns: boundedTurns,
      historyText,
      knowledgePrompt,
    });

    const generation = await agent.generate(
      [
        {
          role: "user",
          content: turnPrompt,
        },
      ],
      {
        toolChoice: "auto",
        structuredOutput: {
          schema: agentResponseSchema,
        },
      }
    );

    const parsedFromObject = generation.object
      ? agentResponseSchema.safeParse(generation.object)
      : null;

    let parsed: z.infer<typeof agentResponseSchema>;

    if (parsedFromObject?.success) {
      parsed = parsedFromObject.data;
    } else {
      const parsedFromText = safeParseJson(generation.text);
      if (parsedFromText) {
        parsed = parsedFromText;
      } else {
        parsed = {
          text: generation.text,
          emotion: profile.defaults.emotion,
          shouldEnd: false,
          reasoning: "構造化出力の解析に失敗しました。",
          focus: null,
          closingSummary: null,
        };
      }
    }

    const resolvedEmotion = coerceEmotion(parsed.emotion, personaId);

    const ttsResult = await synthesizeElevenLabsSpeech({
      text: parsed.text,
      voiceId:
        process.env[profile.voice.voiceIdEnv] ?? profile.voice.fallbackVoiceId ?? "",
      emotion: resolvedEmotion,
      metadata: {
        personaId,
        topic,
        turnIndex: index + 1,
      },
    });

    const currentTurn: ConversationTurn = {
      speaker: personaId,
      text: parsed.text,
      emotion: resolvedEmotion,
      audioBase64: ttsResult.success ? ttsResult.audioBase64 : undefined,
      mimeType: ttsResult.success ? ttsResult.mimeType : undefined,
      audioError: ttsResult.success ? undefined : ttsResult.reason,
      reasoning: parsed.reasoning,
      focus: parsed.focus ?? undefined,
    };

    if (!ttsResult.success && ttsResult.reason) {
      console.warn(
        `[TTS] ${profile.name} audio skipped: ${ttsResult.reason}`
      );
    }

    turns.push(currentTurn);
    endedBy = personaId;

    if (parsed.shouldEnd) {
      summary = parsed.closingSummary ?? summary ?? createFallbackSummary(topic, turns);
    }

    if (index === boundedTurns - 1 && !summary) {
      summary = parsed.closingSummary ?? createFallbackSummary(topic, turns);
    }
  }

  return {
    topic,
    turns,
    summary,
    endedBy,
    totalTurns: turns.length,
  };
};

const safeParseJson = (
  text: string
): z.infer<typeof agentResponseSchema> | null => {
  try {
    return agentResponseSchema.parse(JSON.parse(text));
  } catch (error) {
    return null;
  }
};

const createFallbackSummary = (topic: string, turns: ConversationTurn[]) => {
  const lastTwo = turns.slice(-2);
  const focusHints = lastTwo
    .map((turn) => turn.focus)
    .filter((focus): focus is string => Boolean(focus));

  const focusText = focusHints.length
    ? `焦点: ${Array.from(new Set(focusHints)).join(" / ")}`
    : "";

  return [
    `お題「${topic}」について両者が議論し、${turns.length}ターンで主要な論点を共有しました。`,
    focusText,
  ]
    .filter(Boolean)
    .join(" ");
};

interface BuildTurnPromptInput {
  topic: string;
  personaId: PersonaId;
  personaLabel: string;
  partnerLabel: string;
  turnIndex: number;
  maxTurns: number;
  historyText: string;
  knowledgePrompt: string;
}

const buildTurnPrompt = ({
  topic,
  personaId,
  personaLabel,
  partnerLabel,
  turnIndex,
  maxTurns,
  historyText,
  knowledgePrompt,
}: BuildTurnPromptInput) => {
  const persona = PERSONA_PROFILES[personaId];

  return `
### お題
${topic}

### 会話ターン
- 現在のターン: ${turnIndex}/${maxTurns}
- 今回話すキャラクター: ${personaLabel}
- 相手キャラクター: ${partnerLabel}

### 会話履歴
${historyText}

### 参考資料
${knowledgePrompt}

### タスク
1. ${personaLabel}として自然な口調で発話する。
2. 合意形成に向けたアイデア・提案・問いかけを行う。
3. 感情トーンは ${persona.defaults.emotion} を基準に、状況に合わせて調整する。
4. 必ずJSON形式で応答する。JSON以外を出力しない。
`.trim();
};
