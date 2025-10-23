import { PERSONA_PROFILES, PersonaId, KnowledgeSnippet } from "../../data/personas";

export interface RetrievalInput {
  personaId: PersonaId;
  topic: string;
  historyTexts?: string[];
  maxResults?: number;
}

const DEFAULT_MAX_RESULTS = 3;

const normalise = (text: string) =>
  text
    .toLowerCase()
    .replace(/[！!。.,、]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (text: string) =>
  normalise(text)
    .split(" ")
    .filter(Boolean);

const scoreSnippet = (snippet: KnowledgeSnippet, tokens: string[]) => {
  const searchable = normalise(
    [
      snippet.title,
      snippet.summary,
      snippet.detail,
      snippet.tags.join(" "),
    ].join(" ")
  );

  const searchableTokens = new Set(tokenize(searchable));
  let score = 0;

  tokens.forEach((token) => {
    if (token.length === 0) return;
    if (searchableTokens.has(token)) {
      score += 2;
    } else if (searchable.includes(token)) {
      score += 1;
    }
  });

  return score;
};

export const retrievePersonaKnowledge = ({
  personaId,
  topic,
  historyTexts = [],
  maxResults = DEFAULT_MAX_RESULTS,
}: RetrievalInput): KnowledgeSnippet[] => {
  const persona = PERSONA_PROFILES[personaId];
  if (!persona) {
    return [];
  }

  const tokens = new Set<string>();
  tokenize(topic).forEach((token) => tokens.add(token));
  historyTexts.forEach((text) => {
    tokenize(text).forEach((token) => tokens.add(token));
  });

  const scored = persona.knowledge
    .map((snippet) => ({
      snippet,
      score: scoreSnippet(snippet, Array.from(tokens)),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const fallback = persona.knowledge.slice(0, maxResults);

  if (scored.length === 0) {
    return fallback;
  }

  return scored.slice(0, maxResults).map((entry) => entry.snippet);
};

export const formatKnowledgeForPrompt = (snippets: KnowledgeSnippet[]): string => {
  if (snippets.length === 0) {
    return "補足資料は見つかりませんでした。キャラクター設定と会話文脈を優先してください。";
  }

  return snippets
    .map(
      (snippet, index) =>
        `【資料${index + 1}: ${snippet.title}】\n概要: ${snippet.summary}\n詳細: ${snippet.detail}`
    )
    .join("\n\n");
};

export const formatConversationHistory = (historyTexts: string[]): string => {
  if (historyTexts.length === 0) {
    return "まだ会話は始まっていません。初手としてお題に沿った提案や問いかけから始めてください。";
  }

  return historyTexts
    .map((turn, index) => `Turn ${index + 1}: ${turn}`)
    .join("\n");
};

