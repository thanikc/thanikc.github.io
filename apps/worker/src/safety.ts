// Margin above MIN_SCORE an answer must be grounded by before it is cached.
export const CACHE_MARGIN = 0.05;

const UNSAFE = [/!\[[^\]]*\]\(/, /<[a-z!/]/i, /\b(?:https?:\/\/|www\.)/i];

// Cached answers are replayed to other visitors, so keep out images, HTML and external URLs.
export const isCacheSafe = (answer: string): boolean => !UNSAFE.some(re => re.test(answer));

export const MODERATION_MODEL = '@cf/meta/llama-guard-3-8b';

/**
 * Asks Llama Guard whether the answer is safe. Fails open: an error is reported, not thrown.
 * Output is the model's raw text, e.g. `{ response: '\n\nsafe' }` or
 * `{ response: '\n\nunsafe\nS1' }` (recorded from the REST API, 2026-11-08); the first line is
 * the verdict, the rest the categories. Anything else is 'error'.
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
    })) as { response?: unknown } | null;
    const verdict = typeof out?.response === 'string' ? out.response.trim().split('\n')[0] : '';
    return verdict === 'safe' || verdict === 'unsafe' ? verdict : 'error';
  } catch {
    return 'error';
  }
}
