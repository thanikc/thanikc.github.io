import { answerLanguage } from './rag';

/** What `/api/chat` returns for a hit, minus the `cached` tier the handler adds. */
export interface CachedAnswer {
  answer: string;
  provider: string;
  sources: unknown[];
}

export interface CacheEntry extends CachedAnswer {
  key: string;
  locale: string;
  question: string;
}

const TTL_SECONDS = 30 * 24 * 60 * 60;

// Read through a cast so this compiles whether or not `wrangler types` emitted them.
type CacheEnv = { CACHE_DB?: D1Database; CACHE_EPOCH?: string };
const cacheEnv = (env: Env) => env as unknown as CacheEnv;
const epochOf = (env: Env) => cacheEnv(env).CACHE_EPOCH ?? '1';

/** The locales the cache keeps apart: a published one, else English. */
export const cacheLocale = (locale: unknown): string =>
  answerLanguage(locale) ? String(locale) : 'en';

export async function cacheKey(message: string, locale: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${locale}\n${message.trim().toLowerCase()}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

const cutoff = () => Math.floor(Date.now() / 1000) - TTL_SECONDS;

const toCached = (row: { answer: string; provider: string; sources: string }): CachedAnswer => ({
  answer: row.answer,
  provider: row.provider,
  sources: JSON.parse(row.sources),
});

/**
 * Best-effort by contract: no binding, or any D1 failure, is a plain miss/no-op —
 * the cache must never fail a request.
 */
async function guarded<T>(env: Env, fallback: T, run: (db: D1Database) => Promise<T>): Promise<T> {
  const db = cacheEnv(env).CACHE_DB;
  if (!db) return fallback;
  try {
    return await run(db);
  } catch {
    return fallback;
  }
}

export const lookupExact = (env: Env, key: string): Promise<CachedAnswer | null> =>
  guarded(env, null, async db => {
    const row = await db
      .prepare(
        'SELECT answer, provider, sources FROM answer_cache WHERE key = ? AND epoch = ? AND created_at >= ?',
      )
      .bind(key, epochOf(env), cutoff())
      .first<{ answer: string; provider: string; sources: string }>();
    return row ? toCached(row) : null;
  });

/** Upserts the entry, and drops rows from other epochs or past the TTL while there. */
export const store = (env: Env, entry: CacheEntry): Promise<void> =>
  guarded(env, undefined, async db => {
    const epoch = epochOf(env);
    await db.batch([
      db
        .prepare(
          'INSERT OR REPLACE INTO answer_cache (key, epoch, locale, question, answer, provider, sources, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        )
        .bind(
          entry.key,
          epoch,
          entry.locale,
          entry.question,
          entry.answer,
          entry.provider,
          JSON.stringify(entry.sources),
          Math.floor(Date.now() / 1000),
        ),
      db
        .prepare('DELETE FROM answer_cache WHERE epoch != ? OR created_at < ?')
        .bind(epoch, cutoff()),
    ]);
  });
