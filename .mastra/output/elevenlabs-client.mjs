import { E as EMOTION_TONE_MAP } from './personas.mjs';

const DEFAULT_MODEL_ID = "eleven_multilingual_v2";
const resolveApiBaseUrl = () => process.env.ELEVENLABS_API_BASE_URL?.replace(/\/$/, "") ?? "https://api.elevenlabs.io";
const getVoiceSettings = (emotion) => {
  if (!emotion) {
    return void 0;
  }
  const mapping = EMOTION_TONE_MAP[emotion];
  if (!mapping) {
    return void 0;
  }
  return {
    stability: mapping.elevenLabs.stability,
    similarity_boost: mapping.elevenLabs.similarityBoost,
    style: mapping.elevenLabs.style,
    use_speaker_boost: mapping.elevenLabs.useSpeakerBoost
  };
};
const synthesizeElevenLabsSpeech = async ({
  text,
  voiceId,
  emotion,
  modelId = DEFAULT_MODEL_ID,
  languageCode,
  metadata
}) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      reason: "ELEVENLABS_API_KEY is not set. Audio\u5408\u6210\u306F\u30B9\u30AD\u30C3\u30D7\u3055\u308C\u307E\u3057\u305F\u3002"
    };
  }
  if (!voiceId) {
    return {
      success: false,
      reason: "ElevenLabs\u306EvoiceId\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002\u74B0\u5883\u5909\u6570\u7D4C\u7531\u3067voiceId\u3092\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002"
    };
  }
  const baseUrl = resolveApiBaseUrl();
  const url = `${baseUrl}/v1/text-to-speech/${voiceId}`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
        "xi-api-key": apiKey
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: getVoiceSettings(emotion),
        generation_config: {
          language: languageCode ?? "ja"
        },
        metadata,
        optimize_streaming_latency: 4
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        reason: `ElevenLabs API Error: ${response.status} ${response.statusText} ${errorText}`
      };
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    return {
      success: true,
      audioBase64: buffer.toString("base64"),
      mimeType: response.headers.get("content-type") ?? "audio/mpeg"
    };
  } catch (error) {
    return {
      success: false,
      reason: `ElevenLabs API request failed: ${error.message}`
    };
  }
};

export { synthesizeElevenLabsSpeech as s };
