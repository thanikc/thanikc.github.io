/** Shapes of the worker's `POST /api/chat` contract (see `apps/worker/src/index.ts`). */

import { SupportedLocale } from '../../shared/i18n/locales';

export type ChatRole = 'user' | 'assistant';

export interface ChatTurn {
  role: ChatRole;
  content: string;
  /** Distinct titles of the knowledge-base documents an answer looked in. Display only. */
  sources?: string[];
  /** The worker's proof that it wrote this assistant turn; sent back with the history. */
  answerSig?: string;
}

export interface ChatSource {
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
  /** Present when the worker signs answers; echoed on the assistant turn in later history. */
  answerSig?: string;
}
