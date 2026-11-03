import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error — plain .mjs ops script, no types
import { THRESHOLDS, evaluate, queries, queryAnalytics, renderIssue } from '../scripts/alerts.mjs';

interface Metrics {
  total: number;
  failed: number;
  p95Ms: number;
  failovers: number;
  generations: number;
  dailyLimit: number;
  blocked: number;
  blockedHourlyAvg7d: number;
}
interface Check {
  name: string;
  breached: boolean;
  detail: string;
}

const healthy: Metrics = {
  total: 100,
  failed: 0,
  p95Ms: 4000,
  failovers: 5,
  generations: 100,
  dailyLimit: 1000,
  blocked: 0,
  blockedHourlyAvg7d: 1,
};
const run = (over: Partial<Metrics>): Check[] => evaluate({ ...healthy, ...over });
const breached = (checks: Check[]) => checks.filter(c => c.breached).map(c => c.name);

describe('evaluate', () => {
  it('passes every check on healthy metrics', () => expect(breached(run({}))).toEqual([]));

  it.each([
    ['failed-rate', { failed: 10 }, { failed: 11 }],
    ['p95-latency', { p95Ms: 15000 }, { p95Ms: 16000 }],
    ['failover-rate', { failovers: 30 }, { failovers: 31 }],
    ['budget', { generations: 800 }, { generations: 801 }],
    ['blocked-rate', { blocked: 3, blockedHourlyAvg7d: 1 }, { blocked: 4, blockedHourlyAvg7d: 1 }],
  ])('%s breaches only above its threshold', (name, atLimit, over) => {
    expect(breached(run(atLimit))).not.toContain(name);
    expect(breached(run(over))).toContain(name);
  });

  it('does not alert on rates from fewer than 20 requests', () => {
    const quiet = run({ total: 10, failed: 10, failovers: 10, p95Ms: 60000 });
    expect(breached(quiet)).toEqual([]);
  });

  it('ignores a handful of blocked answers against a zero baseline', () =>
    expect(breached(run({ blocked: 2, blockedHourlyAvg7d: 0 }))).toEqual([]));

  it('skips the budget check when no limit is configured', () =>
    expect(breached(run({ generations: 5000, dailyLimit: 0 }))).toEqual([]));

  it('exposes the thresholds from the design', () =>
    expect(THRESHOLDS).toEqual({
      failedRate: 0.1,
      p95Ms: 15000,
      failoverRate: 0.3,
      budgetUsed: 0.8,
      blockedFactor: 3,
      minBlocked: 3,
      minRequests: 20,
    }));
});

describe('renderIssue', () => {
  it('lists only the breached checks', () => {
    const { title, body } = renderIssue(run({ failed: 50, p95Ms: 1 }));
    expect(title).toContain('AI Ling');
    expect(body).toContain('failed-rate');
    expect(body).not.toContain('p95-latency');
  });
});

describe('queries', () => {
  it('read the AI Ling dataset over the stated windows', () => {
    expect(queries.window).toContain('ai_ling_chat');
    expect(queries.window).toContain("INTERVAL '1' HOUR");
    expect(queries.today).toContain('toStartOfDay');
    expect(queries.baseline).toContain("INTERVAL '7' DAY");
  });
});

describe('queryAnalytics', () => {
  const opts = { accountId: 'acc', token: 'tok', sql: 'SELECT 1' };

  it('posts the SQL with a bearer token and returns the first row', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ data: [{ total: 7 }] }), { status: 200 }));

    const row = await queryAnalytics(fetchFn, opts);

    expect(row).toEqual({ total: 7 });
    const [url, init] = fetchFn.mock.calls[0]!;
    expect(url).toBe('https://api.cloudflare.com/client/v4/accounts/acc/analytics_engine/sql');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer tok');
    expect(init.body).toBe('SELECT 1');
  });

  it('returns an empty row when the dataset has no points yet', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('{"data":[]}', { status: 200 }));
    expect(await queryAnalytics(fetchFn, opts)).toEqual({});
  });

  it('throws on a non-200 answer', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('nope', { status: 403 }));
    await expect(queryAnalytics(fetchFn, opts)).rejects.toThrow('403');
  });
});
