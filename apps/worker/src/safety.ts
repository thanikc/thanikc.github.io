// Margin above MIN_SCORE an answer must be grounded by before it is cached.
export const CACHE_MARGIN = 0.05;

const UNSAFE = [/!\[[^\]]*\]\(/, /<[a-z!/]/i, /\b(?:https?:\/\/|www\.)/i];

// Cached answers are replayed to other visitors, so keep out images, HTML and external URLs.
export const isCacheSafe = (answer: string): boolean => !UNSAFE.some(re => re.test(answer));

export const MODERATION_MODEL = '@cf/meta/llama-guard-3-8b';

/**
 * Asks Llama Guard whether the answer is safe. Fails open: an error is reported, not thrown.
 * Output shape `{ response: { safe: boolean, categories?: string[] } }` is taken from Cloudflare's
 * docs and is UNVERIFIED against a live call (confirm in the Task 9 eval); anything else is 'error'.
 */
export async function moderate(
  question: string,
  answer: string,
  env: Env,
): Promise<'safe' | 'unsafe' | 'error'> {
  try {
    const out = (await (
      env.AI as unknown as { run(model: string, input: unknown): Promise<unknown> }
    ).run(MODERATION_MODEL, {
      messages: [
        { role: 'user', content: question },
        { role: 'assistant', content: answer },
      ],
    })) as { response?: { safe?: unknown } } | null;
    const safe = out?.response?.safe;
    return typeof safe === 'boolean' ? (safe ? 'safe' : 'unsafe') : 'error';
  } catch {
    return 'error';
  }
}
