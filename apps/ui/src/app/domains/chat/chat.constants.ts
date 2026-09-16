/** Prior turns sent as history with each question, keeping the worker's prompt small. */
export const CHAT_HISTORY_LIMIT = 6;

/** Shown when the worker cannot answer (every provider failed, or the network is down). */
export const CHAT_ERROR_MESSAGE = $localize`:Shown when the chat request fails@@chat.error:Sorry, I couldn't get an answer just now. Please try again.`;

/**
 * Starter questions offered in the empty transcript. Each leads into depth the static
 * page leaves out, and each is answerable from the knowledge base in `apps/worker/content`.
 */
export const CHAT_SUGGESTIONS: readonly string[] = [
  $localize`:Starter question offered in the empty chat@@chat.suggestion.complexSystem:What's the most complex system Thanik has worked on?`,
  $localize`:Starter question offered in the empty chat@@chat.suggestion.builtFromScratch:What has Thanik built from scratch?`,
  $localize`:Starter question offered in the empty chat@@chat.suggestion.aiParadigmShift:What's Thanik's take on building software with AI?`,
  $localize`:Starter question offered in the empty chat@@chat.suggestion.howAiLingWorks:How does AI Ling work?`,
];
