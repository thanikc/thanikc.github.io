/** Shapes of the worker's `POST /api/chat` contract (see `apps/worker/src/index.ts`). */

export type ChatRole = 'user' | 'assistant';

export interface ChatTurn {
  role: ChatRole;
  content: string;
}

export interface ChatSource {
  text: string;
  score: number;
}

export interface ChatRequest {
  message: string;
  history: ChatTurn[];
}

export interface ChatResponse {
  answer: string;
  provider: string;
  sources: ChatSource[];
}

export interface ChatErrorResponse {
  error: string;
  attempts?: string[];
}
