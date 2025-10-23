import { EmotionTone, PersonaId } from "../../data/personas";

export interface AgentTurnResponse {
  text: string;
  emotion: EmotionTone;
  shouldEnd: boolean;
  closingSummary?: string | null;
  reasoning: string;
  focus?: string;
}

export interface ConversationTurn {
  speaker: PersonaId;
  text: string;
  emotion: EmotionTone;
  audioBase64?: string;
  mimeType?: string;
  audioError?: string;
  reasoning: string;
  focus?: string;
}

export interface ConversationResult {
  topic: string;
  turns: ConversationTurn[];
  summary?: string;
  endedBy: PersonaId;
  totalTurns: number;
}

export interface ConversationRequestInput {
  topic: string;
  maxTurns?: number;
  temperature?: number;
}
