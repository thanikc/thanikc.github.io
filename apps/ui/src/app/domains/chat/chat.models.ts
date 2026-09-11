/** Shapes of the worker's `POST /api/chat` contract (see `apps/worker/src/index.ts`). */

export type ChatRole = 'user' | 'assistant';

export interface ChatTurn {
  role: ChatRole;
  content: string;
  /** Distinct titles of the knowledge-base documents an answer looked in. Display only. */
  sources?: string[];
}

export interface ChatSource {
  text: string;
  score: number;
  title?: string;
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
