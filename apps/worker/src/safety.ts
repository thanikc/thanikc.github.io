// Margin above MIN_SCORE an answer must be grounded by before it is cached.
export const CACHE_MARGIN = 0.05;

const UNSAFE = [/!\[[^\]]*\]\(/, /<[a-z!/]/i, /\b(?:https?:\/\/|www\.)/i];

// Cached answers are replayed to other visitors, so keep out images, HTML and external URLs.
export const isCacheSafe = (answer: string): boolean => !UNSAFE.some(re => re.test(answer));
