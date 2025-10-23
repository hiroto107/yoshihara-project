import { EmotionTone, EMOTION_TONE_MAP } from "../../data/personas";

export interface ElevenLabsSynthesisParams {
  text: string;
  voiceId: string;
  emotion?: EmotionTone;
  modelId?: string;
  languageCode?: string;
  /**
   * Optional metadata for logging/debugging.
   */
  metadata?: Record<string, unknown>;
}

export interface ElevenLabsSynthesisResult {
  success: boolean;
  audioBase64?: string;
  mimeType?: string;
  durationSeconds?: number;
  reason?: string;
}

const DEFAULT_MODEL_ID = "eleven_multilingual_v2";

const resolveApiBaseUrl = () =>
  process.env.ELEVENLABS_API_BASE_URL?.replace(/\/$/, "") ??
  "https://api.elevenlabs.io";

const getVoiceSettings = (emotion?: EmotionTone) => {
  if (!emotion) {
    return undefined;
  }

  const mapping = EMOTION_TONE_MAP[emotion];
  if (!mapping) {
    return undefined;
  }

  return {
    stability: mapping.elevenLabs.stability,
    similarity_boost: mapping.elevenLabs.similarityBoost,
    style: mapping.elevenLabs.style,
    use_speaker_boost: mapping.elevenLabs.useSpeakerBoost,
  };
};

export const synthesizeElevenLabsSpeech = async ({
  text,
  voiceId,
  emotion,
  modelId = DEFAULT_MODEL_ID,
  languageCode,
  metadata,
}: ElevenLabsSynthesisParams): Promise<ElevenLabsSynthesisResult> => {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      reason:
        "ELEVENLABS_API_KEY is not set. Audio合成はスキップされました。",
    };
  }

  if (!voiceId) {
    return {
      success: false,
      reason:
        "ElevenLabsのvoiceIdが設定されていません。環境変数経由でvoiceIdを指定してください。",
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
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: getVoiceSettings(emotion),
        generation_config: {
          language: languageCode ?? "ja",
        },
        metadata,
        optimize_streaming_latency: 4,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        reason: `ElevenLabs API Error: ${response.status} ${response.statusText} ${errorText}`,
      };
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    return {
      success: true,
      audioBase64: buffer.toString("base64"),
      mimeType: response.headers.get("content-type") ?? "audio/mpeg",
    };
  } catch (error) {
    return {
      success: false,
      reason: `ElevenLabs API request failed: ${(error as Error).message}`,
    };
  }
};

