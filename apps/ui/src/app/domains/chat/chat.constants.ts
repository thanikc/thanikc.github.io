/** Prior turns sent as history with each question, keeping the worker's prompt small. */
export const CHAT_HISTORY_LIMIT = 6;

/** Shown when the worker cannot answer (every provider failed, or the network is down). */
export const CHAT_ERROR_MESSAGE = $localize`:Shown when the chat request fails@@chat.error:Sorry, I couldn't get an answer just now. Please try again.`;

/** Shown on a 429: the worker is fine, the visitor (or everyone together) is asking too fast. */
export const CHAT_RATE_LIMITED_MESSAGE = $localize`:Shown when the chat is rate limited@@chat.rateLimited:I'm getting a lot of questions right now. Please wait a minute, then try again.`;

/** Session-storage key the conversation is kept under (listed in the privacy policy). */
export const CHAT_STORAGE_KEY = 'chat-conversation';

/**
 * Starter questions offered in the empty transcript. Each leads into depth the static
 * page leaves out, and each is answerable from the knowledge base in `apps/worker/content`.
 */
export const CHAT_SUGGESTIONS: readonly string[] = [
  $localize`:Starter question offered in the empty chat@@chat.suggestion.complexSystem:What's the most complex system Thanik has worked on?`,
  $localize`:Starter question offered in the empty chat@@chat.suggestion.builtFromScratch:What has Thanik built from scratch?`,
  $localize`:Starter question offered in the empty chat@@chat.suggestion.aiDevCriteria:What would Thanik look for in a developer using AI?`,
  $localize`:Starter question offered in the empty chat@@chat.suggestion.howAiLingWorks:How does AI Ling work?`,
];
