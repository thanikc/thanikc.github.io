/** Prior turns sent as history with each question, keeping the worker's prompt small. */
export const CHAT_HISTORY_LIMIT = 6;

/** Shown when the worker cannot answer (every provider failed, or the network is down). */
export const CHAT_ERROR_MESSAGE = "Sorry, I couldn't get an answer just now. Please try again.";

/** Starter questions offered in the empty transcript; each is answerable from the résumé. */
export const CHAT_SUGGESTIONS: readonly string[] = [
  "What is Thanik's current role?",
  'Which technologies has Thanik worked with?',
  'Which languages does Thanik speak?',
];
