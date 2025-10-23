import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { P as PERSONA_PROFILES } from '../personas.mjs';
import { s as synthesizeElevenLabsSpeech } from '../elevenlabs-client.mjs';

const personaIdSchema = z.enum(["reisen", "sanno"]);
const emotionSchema = z.enum([
  "calm",
  "cheerful",
  "confident",
  "reflective",
  "nostalgic",
  "surprised",
  "empathetic"
]);
const elevenLabsTtsTool = createTool({
  id: "generate-elevenlabs-tts",
  description: "ElevenLabs API \u3092\u4F7F\u3063\u3066\u97F3\u58F0\u5408\u6210\u3092\u884C\u3046\u3002\u30C6\u30AD\u30B9\u30C8\u3001\u8A71\u8005ID\u3001\u611F\u60C5\u3092\u6E21\u3059\u3068 base64 \u306E\u97F3\u58F0\u30C7\u30FC\u30BF\u3092\u8FD4\u3059\u3002",
  inputSchema: z.object({
    text: z.string().min(1, "\u30C6\u30AD\u30B9\u30C8\u306F\u5FC5\u9808\u3067\u3059").describe("\u97F3\u58F0\u5316\u3057\u305F\u3044\u65E5\u672C\u8A9E\u30C6\u30AD\u30B9\u30C8"),
    personaId: personaIdSchema.describe("\u30AD\u30E3\u30E9\u30AF\u30BF\u30FCID\u3002voiceId\u672A\u6307\u5B9A\u6642\u306B\u5229\u7528\u3059\u308B\u3002").optional(),
    voiceId: z.string().describe("ElevenLabs\u306EvoiceId\u3002\u6307\u5B9A\u3057\u306A\u3044\u5834\u5408\u306FpersonaId\u304B\u3089\u89E3\u6C7A\u3002").optional(),
    emotion: emotionSchema.describe("\u30AD\u30E3\u30E9\u30AF\u30BF\u30FC\u611F\u60C5\u30C8\u30FC\u30F3").optional(),
    modelId: z.string().describe("\u4F7F\u7528\u3059\u308BElevenLabs\u30E2\u30C7\u30EBID\u3002\u672A\u6307\u5B9A\u6642\u306Feleven_multilingual_v2\u3002").optional()
  }),
  outputSchema: z.object({
    success: z.boolean(),
    audioBase64: z.string().describe("base64\u30A8\u30F3\u30B3\u30FC\u30C9\u3057\u305F\u97F3\u58F0\u30C7\u30FC\u30BF (audio/mpeg)").optional(),
    mimeType: z.string().describe("\u97F3\u58F0\u306EMIME\u30BF\u30A4\u30D7").optional(),
    reason: z.string().describe("\u5931\u6557\u6642\u306E\u7406\u7531\u307E\u305F\u306F\u8B66\u544A").optional()
  }),
  execute: async ({ context }) => {
    const { text, personaId, voiceId, emotion, modelId } = context;
    const resolvedPersonaId = personaId ?? inferPersonaId(voiceId);
    const personaProfile = resolvedPersonaId ? PERSONA_PROFILES[resolvedPersonaId] : void 0;
    const resolvedVoiceId = voiceId ?? (personaProfile ? process.env[personaProfile.voice.voiceIdEnv] : void 0) ?? personaProfile?.voice.fallbackVoiceId ?? "";
    const resolvedEmotion = emotion ? emotion : personaProfile?.defaults.emotion;
    const synthesisParams = {
      text,
      voiceId: resolvedVoiceId,
      modelId,
      emotion: resolvedEmotion,
      metadata: {
        persona: resolvedPersonaId
      }
    };
    const result = await synthesizeElevenLabsSpeech(synthesisParams);
    return result;
  }
});
const inferPersonaId = (voiceId) => {
  if (!voiceId) return void 0;
  const normalized = voiceId.toLowerCase();
  if (normalized.includes("reisen")) return "reisen";
  if (normalized.includes("sanno")) return "sanno";
  return void 0;
};

export { elevenLabsTtsTool };
