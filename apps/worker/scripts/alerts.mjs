#!/usr/bin/env node
// Hourly health check for AI Ling. Queries the Analytics Engine dataset, compares the
// last hour with fixed thresholds, and prints `{ breached, title, body }` as JSON for the
// workflow, which opens, comments on or closes the `ai-ling-alert` issue. Always exits 0
// when the query worked: alerting is the workflow's job, a crash here means "could not check".
//
//   CLOUDFLARE_ACCOUNT_ID=… CF_ANALYTICS_TOKEN=… DAILY_LIMIT=1000 node scripts/alerts.mjs

import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const THRESHOLDS = {
  failedRate: 0.1,
  p95Ms: 15000,
  failoverRate: 0.3,
  budgetUsed: 0.8,
  blockedFactor: 3,
  /** A handful of blocked answers against a quiet baseline is noise, not an attack. */
  minBlocked: 3,
  /** Rates over fewer requests than this say nothing. */
  minRequests: 20,
};

// blob2 locale, blob3 cache tier, blob4 outcome; double1 latency ms, double3 failovers.
const WINDOW = `SELECT sum(_sample_interval) AS total,
  sumIf(_sample_interval, blob4 = 'failed') AS failed,
  sumIf(_sample_interval, double3 > 0) AS failovers,
  sumIf(_sample_interval, blob4 = 'blocked') AS blocked,
  quantileWeighted(0.95, double1, _sample_interval) AS p95_ms
FROM ai_ling_chat WHERE timestamp > NOW() - INTERVAL '1' HOUR`;

// Uncached answers that reached a provider, as takeGeneration counts them.
const TODAY = `SELECT sum(_sample_interval) AS generations
FROM ai_ling_chat WHERE timestamp >= toStartOfDay(NOW()) AND blob3 = 'none' AND blob4 IN ('ok', 'blocked', 'failed')`;

const BASELINE = `SELECT sumIf(_sample_interval, blob4 = 'blocked') AS blocked
FROM ai_ling_chat WHERE timestamp > NOW() - INTERVAL '7' DAY`;

export const queries = { window: WINDOW, today: TODAY, baseline: BASELINE };

/**
 * @param {{ total: number, failed: number, p95Ms: number, failovers: number, generations: number,
 *   dailyLimit: number, blocked: number, blockedHourlyAvg7d: number }} m
 * @returns {{ name: string, breached: boolean, detail: string }[]}
 */
export function evaluate(m, t = THRESHOLDS) {
  const enough = m.total >= t.minRequests;
  const pct = n => `${(n * 100).toFixed(1)} %`;
  const failedRate = m.total ? m.failed / m.total : 0;
  const failoverRate = m.total ? m.failovers / m.total : 0;
  const budgetUsed = m.dailyLimit ? m.generations / m.dailyLimit : 0;

  return [
    {
      name: 'failed-rate',
      breached: enough && failedRate > t.failedRate,
      detail: `${pct(failedRate)} of ${m.total} requests failed in the last hour (limit ${pct(t.failedRate)})`,
    },
    {
      name: 'p95-latency',
      breached: enough && m.p95Ms > t.p95Ms,
      detail: `p95 latency ${Math.round(m.p95Ms)} ms (limit ${t.p95Ms} ms)`,
    },
    {
      name: 'failover-rate',
      breached: enough && failoverRate > t.failoverRate,
      detail: `${pct(failoverRate)} of requests needed a failover (limit ${pct(t.failoverRate)})`,
    },
    {
      name: 'budget',
      breached: m.dailyLimit > 0 && budgetUsed > t.budgetUsed,
      detail: `${m.generations} of ${m.dailyLimit} daily generations used (${pct(budgetUsed)}, limit ${pct(t.budgetUsed)})`,
    },
    {
      name: 'blocked-rate',
      breached: m.blocked >= t.minBlocked && m.blocked > t.blockedFactor * m.blockedHourlyAvg7d,
      detail: `${m.blocked} blocked answers in the last hour vs ${m.blockedHourlyAvg7d.toFixed(2)}/h over 7 days (limit ${t.blockedFactor}×)`,
    },
  ];
}

/** Issue text for the breached checks. */
export function renderIssue(checks) {
  const lines = checks.filter(c => c.breached).map(c => `- **${c.name}**: ${c.detail}`);
  return {
    title: 'AI Ling alert',
    body: [
      'AI Ling health check failed:',
      '',
      ...lines,
      '',
      'See apps/worker/RUNBOOK.md. This issue closes itself once every check passes.',
    ].join('\n'),
  };
}

/** Runs one Analytics Engine SQL query and returns its first row ({} when there are no points). */
export async function queryAnalytics(fetchFn, { accountId, token, sql }) {
  const res = await fetchFn(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: sql },
  );
  if (!res.ok) throw new Error(`Analytics query failed: HTTP ${res.status}`);
  const { data } = await res.json();
  return data?.[0] ?? {};
}

async function main() {
  const { CLOUDFLARE_ACCOUNT_ID: accountId, CF_ANALYTICS_TOKEN: token, DAILY_LIMIT } = process.env;
  if (!accountId || !token)
    throw new Error('CLOUDFLARE_ACCOUNT_ID and CF_ANALYTICS_TOKEN are required');
  const ask = sql => queryAnalytics(fetch, { accountId, token, sql });
  const [window, today, baseline] = await Promise.all([
    ask(queries.window),
    ask(queries.today),
    ask(queries.baseline),
  ]);
  const num = v => Number(v ?? 0);

  const checks = evaluate({
    total: num(window.total),
    failed: num(window.failed),
    p95Ms: num(window.p95_ms),
    failovers: num(window.failovers),
    generations: num(today.generations),
    dailyLimit: num(DAILY_LIMIT),
    blocked: num(window.blocked),
    blockedHourlyAvg7d: num(baseline.blocked) / (7 * 24),
  });
  const breached = checks.some(c => c.breached);
  console.log(JSON.stringify({ breached, checks, ...renderIssue(checks) }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
