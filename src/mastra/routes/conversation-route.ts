import { registerApiRoute } from "@mastra/core/server";
import { z } from "zod";

import { runConversation } from "../services/conversation-service";

const requestSchema = z.object({
  topic: z
    .string()
    .min(1, "トピックを入力してください。")
    .max(200, "トピックは200文字以内にしてください。"),
  maxTurns: z
    .number()
    .min(2)
    .max(20)
    .optional(),
});

export const conversationRoute = registerApiRoute("/conversation", {
  method: "POST",
  handler: async (c) => {
    const json = await c.req.json();
    const payload = requestSchema.safeParse(json);

    if (!payload.success) {
      return c.json(
        {
          success: false,
          error: "Invalid request payload",
          issues: payload.error.flatten(),
        },
        400
      );
    }

    const result = await runConversation(payload.data);

    return c.json({
      success: true,
      data: result,
    });
  },
});
