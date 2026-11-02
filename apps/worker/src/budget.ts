import { guarded } from './cache';

/**
 * Counts one generation against today's (UTC) budget; false once `DAILY_GENERATION_LIMIT`
 * is spent. Fails open: no limit, no D1 or a D1 error all allow, like the cache.
 */
export function takeGeneration(env: Env, now = new Date()): Promise<boolean> {
  const limit = env.DAILY_GENERATION_LIMIT;
  if (limit === undefined) return Promise.resolve(true);
  return guarded(env, true, async db => {
    const row = await db
      .prepare(
        'INSERT INTO generation_budget (day, count) VALUES (?, 1) ON CONFLICT(day) DO UPDATE SET count = count + 1 RETURNING count',
      )
      .bind(now.toISOString().slice(0, 10))
      .first<{ count: number }>();
    return row!.count <= limit;
  });
}
