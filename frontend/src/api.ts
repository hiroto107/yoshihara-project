import { ConversationResponse } from "./types";

const API_ENDPOINT = "/conversation";

export async function requestConversation(
  topic: string,
  maxTurns?: number
): Promise<ConversationResponse> {
  const response = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic: topic.trim(),
      ...(maxTurns ? { maxTurns } : {}),
    }),
  });

  if (!response.ok) {
    const detail = await safeParseError(response);
    throw new Error(detail ?? `Request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    success: boolean;
    data?: ConversationResponse;
    error?: string;
  };

  if (!payload.success || !payload.data) {
    throw new Error(payload.error ?? "Unexpected API response");
  }

  return payload.data;
}

const safeParseError = async (response: Response) => {
  try {
    const data = await response.json();
    if (typeof data?.error === "string") {
      return data.error;
    }
  } catch (error) {
    // ignore parse fallback
  }
  return null;
};

