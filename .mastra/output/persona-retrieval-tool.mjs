import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { P as PERSONA_PROFILES } from './personas.mjs';

const DEFAULT_MAX_RESULTS = 3;
const normalise = (text) => text.toLowerCase().replace(/[！!。.,、]/g, " ").replace(/\s+/g, " ").trim();
const tokenize = (text) => normalise(text).split(" ").filter(Boolean);
const scoreSnippet = (snippet, tokens) => {
  const searchable = normalise(
    [
      snippet.title,
      snippet.summary,
      snippet.detail,
      snippet.tags.join(" ")
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
const retrievePersonaKnowledge = ({
  personaId,
  topic,
  historyTexts = [],
  maxResults = DEFAULT_MAX_RESULTS
}) => {
  const persona = PERSONA_PROFILES[personaId];
  if (!persona) {
    return [];
  }
  const tokens = /* @__PURE__ */ new Set();
  tokenize(topic).forEach((token) => tokens.add(token));
  historyTexts.forEach((text) => {
    tokenize(text).forEach((token) => tokens.add(token));
  });
  const scored = persona.knowledge.map((snippet) => ({
    snippet,
    score: scoreSnippet(snippet, Array.from(tokens))
  })).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score);
  const fallback = persona.knowledge.slice(0, maxResults);
  if (scored.length === 0) {
    return fallback;
  }
  return scored.slice(0, maxResults).map((entry) => entry.snippet);
};
const formatKnowledgeForPrompt = (snippets) => {
  if (snippets.length === 0) {
    return "\u88DC\u8DB3\u8CC7\u6599\u306F\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u30AD\u30E3\u30E9\u30AF\u30BF\u30FC\u8A2D\u5B9A\u3068\u4F1A\u8A71\u6587\u8108\u3092\u512A\u5148\u3057\u3066\u304F\u3060\u3055\u3044\u3002";
  }
  return snippets.map(
    (snippet, index) => `\u3010\u8CC7\u6599${index + 1}: ${snippet.title}\u3011
\u6982\u8981: ${snippet.summary}
\u8A73\u7D30: ${snippet.detail}`
  ).join("\n\n");
};
const formatConversationHistory = (historyTexts) => {
  if (historyTexts.length === 0) {
    return "\u307E\u3060\u4F1A\u8A71\u306F\u59CB\u307E\u3063\u3066\u3044\u307E\u305B\u3093\u3002\u521D\u624B\u3068\u3057\u3066\u304A\u984C\u306B\u6CBF\u3063\u305F\u63D0\u6848\u3084\u554F\u3044\u304B\u3051\u304B\u3089\u59CB\u3081\u3066\u304F\u3060\u3055\u3044\u3002";
  }
  return historyTexts.map((turn, index) => `Turn ${index + 1}: ${turn}`).join("\n");
};

const personaSchema = z.enum(["reisen", "sanno"]);
const personaRetrievalTool = createTool({
  id: "persona-retrieval",
  description: "\u51B7\u6CC9\u8358\u304F\u3093\u30FB\u5C71\u738B\u30DE\u30F3\u30B7\u30E7\u30F3\u304F\u3093\u306E\u8A2D\u5B9A\u8CC7\u6599\u304B\u3089\u4F1A\u8A71\u306B\u95A2\u9023\u3057\u305D\u3046\u306A\u77E5\u8B58\u3092\u62BD\u51FA\u3059\u308B\u3002",
  inputSchema: z.object({
    personaId: personaSchema.describe("\u30AD\u30E3\u30E9\u30AF\u30BF\u30FCID"),
    topic: z.string().max(500, "\u30C8\u30D4\u30C3\u30AF\u306F500\u6587\u5B57\u4EE5\u5185\u3067\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002").describe("\u30E6\u30FC\u30B6\u30FC\u306E\u304A\u984C\u3084\u76F4\u8FD1\u306E\u8B70\u8AD6\u30DD\u30A4\u30F3\u30C8"),
    history: z.array(z.string()).describe("\u3053\u308C\u307E\u3067\u306E\u4F1A\u8A71\u629C\u7C8B\u3002\u95A2\u9023\u30B9\u30CB\u30DA\u30C3\u30C8\u62BD\u51FA\u306B\u5229\u7528\u3059\u308B\u3002").optional(),
    maxResults: z.number().min(1).max(5).describe("\u8FD4\u5374\u3059\u308B\u30B9\u30CB\u30DA\u30C3\u30C8\u6570\u306E\u4E0A\u9650 (\u65E2\u5B9A\u5024 3)").optional(),
    format: z.enum(["raw", "prompt"]).describe("raw=\u69CB\u9020\u5316\u30C7\u30FC\u30BF, prompt=\u30D7\u30ED\u30F3\u30D7\u30C8\u7528\u6587\u5B57\u5217").optional().default("raw")
  }),
  outputSchema: z.object({
    personaId: personaSchema,
    items: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        summary: z.string(),
        detail: z.string(),
        tags: z.array(z.string())
      })
    ),
    promptText: z.string().describe("format=prompt \u306E\u5834\u5408\u306B\u5229\u7528\u3059\u308B\u6574\u5F62\u6E08\u307F\u30C6\u30AD\u30B9\u30C8").optional()
  }),
  execute: async ({ context }) => {
    const { personaId, topic, history, maxResults, format } = context;
    const snippets = retrievePersonaKnowledge({
      personaId,
      topic,
      historyTexts: history,
      maxResults
    });
    return {
      personaId,
      items: snippets.map((snippet) => ({
        id: snippet.id,
        title: snippet.title,
        summary: snippet.summary,
        detail: snippet.detail,
        tags: snippet.tags
      })),
      promptText: format === "prompt" ? formatKnowledgeForPrompt(snippets) : void 0
    };
  }
});

export { formatKnowledgeForPrompt as a, formatConversationHistory as f, personaRetrievalTool as p, retrievePersonaKnowledge as r };
