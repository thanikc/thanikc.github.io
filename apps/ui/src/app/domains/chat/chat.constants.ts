/** Prior turns sent as history with each question, keeping the worker's prompt small. */
export const CHAT_HISTORY_LIMIT = 6;

/** Shown when the worker cannot answer (every provider failed, or the network is down). */
export const CHAT_ERROR_MESSAGE = "Sorry, I couldn't get an answer just now. Please try again.";

/**
 * Starter questions offered in the empty transcript. Each leads into depth the static
 * page leaves out, and each is answerable from the knowledge base in `apps/worker/content`.
 */
export const CHAT_SUGGESTIONS: readonly string[] = [
  "What's the most complex system Thanik has worked on?",
  'What has Thanik built from scratch?',
  'How does Thanik use AI in a team?',
  'How does AI Ling work?',
];
