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
  /** The question's embedding, for the semantic tier. */
  vector: number[];
}

const TTL_SECONDS = 30 * 24 * 60 * 60;

/** Cosine similarity at or above which a paraphrase counts as the same question. */
export const CACHE_MIN_SIMILARITY = 0.95;

/** Newest rows the semantic tier compares against. */
const SCAN_LIMIT = 200;

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

// D1 hands BLOBs back as JSON number arrays (~4x the bytes), so embeddings are stored
// as base64 text instead.
const encodeVector = (vector: number[]): string =>
  btoa(String.fromCharCode(...new Uint8Array(new Float32Array(vector).buffer)));

const decodeVector = (text: string): Float32Array =>
  new Float32Array(Uint8Array.from(atob(text), c => c.charCodeAt(0)).buffer);

function cosine(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  return dot / (Math.sqrt(normA * normB) || 1);
}

/**
 * The most similar cached question for this locale and epoch, if it clears
 * `CACHE_MIN_SIMILARITY`.
 * ponytail: linear scan over the newest SCAN_LIMIT rows; if the table outgrows that,
 * move only the embeddings back to Vectorize.
 */
export const lookupSemantic = (
  env: Env,
  vector: number[],
  locale: string,
): Promise<CachedAnswer | null> =>
  guarded(env, null, async db => {
    const { results } = await db
      .prepare(
        'SELECT answer, provider, sources, embedding FROM answer_cache WHERE epoch = ? AND locale = ? AND created_at >= ? AND embedding IS NOT NULL ORDER BY created_at DESC LIMIT ?',
      )
      .bind(epochOf(env), locale, cutoff(), SCAN_LIMIT)
      .all<{ answer: string; provider: string; sources: string; embedding: string }>();

    let best: (typeof results)[number] | null = null;
    let bestScore = CACHE_MIN_SIMILARITY;
    for (const row of results) {
      const score = cosine(vector, decodeVector(row.embedding));
      if (score >= bestScore) {
        best = row;
        bestScore = score;
      }
    }
    return best ? toCached(best) : null;
  });

/** Upserts the entry, and drops rows from other epochs or past the TTL while there. */
export const store = (env: Env, entry: CacheEntry): Promise<void> =>
  guarded(env, undefined, async db => {
    const epoch = epochOf(env);
    await db.batch([
      db
        .prepare(
          'INSERT OR REPLACE INTO answer_cache (key, epoch, locale, question, answer, provider, sources, embedding, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        )
        .bind(
          entry.key,
          epoch,
          entry.locale,
          entry.question,
          entry.answer,
          entry.provider,
          JSON.stringify(entry.sources),
          encodeVector(entry.vector),
          Math.floor(Date.now() / 1000),
        ),
      db
        .prepare('DELETE FROM answer_cache WHERE epoch != ? OR created_at < ?')
        .bind(epoch, cutoff()),
    ]);
  });

/** Empties the cache: called when an ingest changed what answers are grounded on. */
export const purgeCache = (env: Env): Promise<void> =>
  guarded(env, undefined, async db => {
    await db.prepare('DELETE FROM answer_cache').run();
  });
