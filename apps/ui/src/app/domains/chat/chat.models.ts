/** Shapes of the worker's `POST /api/chat` contract (see `apps/worker/src/index.ts`). */

import { SupportedLocale } from '../../shared/i18n/locales';

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
  /** Language the answer should come back in; the worker validates it. */
  locale: SupportedLocale;
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
