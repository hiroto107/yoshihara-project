import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import {
  formatKnowledgeForPrompt,
  retrievePersonaKnowledge,
} from "../utils/persona-knowledge";
import { PersonaId } from "../../data/personas";

const personaSchema = z.enum(["reisen", "sanno"]);

export const personaRetrievalTool = createTool({
  id: "persona-retrieval",
  description:
    "冷泉荘くん・山王マンションくんの設定資料から会話に関連しそうな知識を抽出する。",
  inputSchema: z.object({
    personaId: personaSchema.describe("キャラクターID"),
    topic: z
      .string()
      .max(500, "トピックは500文字以内で指定してください。")
      .describe("ユーザーのお題や直近の議論ポイント"),
    history: z
      .array(z.string())
      .describe("これまでの会話抜粋。関連スニペット抽出に利用する。")
      .optional(),
    maxResults: z
      .number()
      .min(1)
      .max(5)
      .describe("返却するスニペット数の上限 (既定値 3)")
      .optional(),
    format: z
      .enum(["raw", "prompt"])
      .describe("raw=構造化データ, prompt=プロンプト用文字列")
      .optional()
      .default("raw"),
  }),
  outputSchema: z.object({
    personaId: personaSchema,
    items: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        summary: z.string(),
        detail: z.string(),
        tags: z.array(z.string()),
      })
    ),
    promptText: z
      .string()
      .describe("format=prompt の場合に利用する整形済みテキスト")
      .optional(),
  }),
  execute: async ({ context }) => {
    const { personaId, topic, history, maxResults, format } = context;
    const snippets = retrievePersonaKnowledge({
      personaId: personaId as PersonaId,
      topic,
      historyTexts: history,
      maxResults,
    });

    return {
      personaId,
      items: snippets.map((snippet) => ({
        id: snippet.id,
        title: snippet.title,
        summary: snippet.summary,
        detail: snippet.detail,
        tags: snippet.tags,
      })),
      promptText: format === "prompt" ? formatKnowledgeForPrompt(snippets) : undefined,
    };
  },
});
