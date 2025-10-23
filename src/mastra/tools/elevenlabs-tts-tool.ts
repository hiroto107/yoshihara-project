import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import {
  EmotionTone,
  PERSONA_PROFILES,
  PersonaId,
} from "../../data/personas";
import {
  ElevenLabsSynthesisParams,
  synthesizeElevenLabsSpeech,
} from "../utils/elevenlabs-client";

const personaIdSchema = z.enum(["reisen", "sanno"]);
const emotionSchema = z.enum([
  "calm",
  "cheerful",
  "confident",
  "reflective",
  "nostalgic",
  "surprised",
  "empathetic",
]);

export const elevenLabsTtsTool = createTool({
  id: "generate-elevenlabs-tts",
  description:
    "ElevenLabs API を使って音声合成を行う。テキスト、話者ID、感情を渡すと base64 の音声データを返す。",
  inputSchema: z.object({
    text: z
      .string()
      .min(1, "テキストは必須です")
      .describe("音声化したい日本語テキスト"),
    personaId: personaIdSchema
      .describe("キャラクターID。voiceId未指定時に利用する。")
      .optional(),
    voiceId: z
      .string()
      .describe("ElevenLabsのvoiceId。指定しない場合はpersonaIdから解決。")
      .optional(),
    emotion: emotionSchema
      .describe("キャラクター感情トーン")
      .optional(),
    modelId: z
      .string()
      .describe("使用するElevenLabsモデルID。未指定時はeleven_multilingual_v2。")
      .optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    audioBase64: z
      .string()
      .describe("base64エンコードした音声データ (audio/mpeg)")
      .optional(),
    mimeType: z
      .string()
      .describe("音声のMIMEタイプ")
      .optional(),
    reason: z
      .string()
      .describe("失敗時の理由または警告")
      .optional(),
  }),
  execute: async ({ context }) => {
    const { text, personaId, voiceId, emotion, modelId } = context;

    const resolvedPersonaId: PersonaId | undefined =
      personaId ?? inferPersonaId(voiceId);
    const personaProfile = resolvedPersonaId
      ? PERSONA_PROFILES[resolvedPersonaId]
      : undefined;

    const resolvedVoiceId =
      voiceId ??
      (personaProfile
        ? process.env[personaProfile.voice.voiceIdEnv]
        : undefined) ??
      personaProfile?.voice.fallbackVoiceId ??
      "";

    const resolvedEmotion: EmotionTone | undefined = emotion
      ? (emotion as EmotionTone)
      : personaProfile?.defaults.emotion;

    const synthesisParams: ElevenLabsSynthesisParams = {
      text,
      voiceId: resolvedVoiceId,
      modelId,
      emotion: resolvedEmotion,
      metadata: {
        persona: resolvedPersonaId,
      },
    };

    const result = await synthesizeElevenLabsSpeech(synthesisParams);

    return result;
  },
});

const inferPersonaId = (voiceId?: string): PersonaId | undefined => {
  if (!voiceId) return undefined;

  const normalized = voiceId.toLowerCase();

  if (normalized.includes("reisen")) return "reisen";
  if (normalized.includes("sanno")) return "sanno";

  return undefined;
};
