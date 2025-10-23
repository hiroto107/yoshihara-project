export type PersonaId = "reisen" | "sanno";

export interface ConversationTurn {
  speaker: PersonaId;
  text: string;
  emotion: string;
  audioBase64?: string;
  mimeType?: string;
  audioError?: string;
  reasoning: string;
  focus?: string;
}

export interface AudioMeta {
  src: string;
  mimeType?: string;
}

export interface ConversationResponse {
  topic: string;
  turns: ConversationTurn[];
  summary?: string;
  endedBy: PersonaId;
  totalTurns: number;
}
