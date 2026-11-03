# AI Ling Hardening, Phase 4 Implementation Plan (operations and delivery)

**Spec:** `docs/specs/2026-11-02-ai-ling-hardening-design.md` §6. Zero spend; absent config = feature off.
Branch: `feat/ai-ling-phase-4`. Worker code is TDD (RED → GREEN → REFACTOR, `pnpm --filter @thanikc/worker test`);
workflow YAML and docs are verified by `actionlint`-free checks listed per task (YAML parse + a spec that reads the file).
No UI strings, so no i18n changes. No new data processed, so no privacy-policy change.

## Domain (ubiquitous language)

- **Outcome**: `ok | refused | failed | budget | blocked | forbidden | disabled` (adds `forbidden` for the 403 gate, `disabled` for the kill switch).
- **Alert check**: a named threshold over a 1 h window, `{ name, breached: boolean, detail }`. All pure over a metrics row.
- **Alert issue**: the single GitHub issue labelled `ai-ling-alert`; open while any check breaches, closed when all pass.

## Scenarios

```
Given the gate rejects a request              When /api/chat answers 403   Then telemetry records outcome "forbidden"
Given CHAT_DISABLED="true"                    When anyone calls /api/chat  Then 503 {error, localized message}, no binding touched
Given CHAT_DISABLED unset or "false"          When /api/chat is called     Then behaviour is unchanged
Given failed rate 11% over 1 h                When alerts run              Then check "failed-rate" breaches (10% → no)
Given p95 latency 16 s / failovers 31% / budget 81% / blocked 3.1× its 7-day avg   Then each check breaches; at the limit it doesn't
Given too few requests in the window (< 20)   When rates are computed      Then rate checks don't breach (no alert on noise)
Given any breach and no open alert issue      When the workflow runs       Then it opens one issue; with one open it comments instead
Given all checks pass and an alert issue open Then it closes the issue
Given the nightly eval fails                  Then it opens or comments on the same issue
```

## Task 1: telemetry outcomes and kill switch

- Files: `apps/worker/src/{telemetry,index,rag}.ts`, `apps/worker/wrangler.jsonc`, tests in `telemetry.spec.ts`, `api.spec.ts`, `gate.spec.ts`.
- Models: `ChatPoint.outcome` gains `'forbidden' | 'disabled'`; `ChatPoint.cacheEligible: boolean` written as a double
  (`doubles: [..., cacheEligible ? 1 : 0]`, appended last so existing columns keep their index);
  `Env.CHAT_DISABLED?: string` var; `disabledAnswer(locale)` in `rag.ts` next to the busy answer.
- RED: stubbed `ANALYTICS.writeDataPoint` sees `forbidden` on a gate 403 and `disabled` on a 503;
  `CHAT_DISABLED: 'true'` → 503 `{ error: 'disabled', answer: <localized> }` before gate, limiter, D1, AI, `fetch`;
  `'false'`/absent → normal; `cacheEligible` is 1 on an ok fresh answer that is stored, 0 for PII / follow-up / unsafe.
- GREEN: kill-switch check first thing in the handler (after `X-Request-Id`); `track` at the 403 return; `cacheEligible`
  passed from the existing store decision.
- Docs: `wrangler.jsonc` vars comment for `CHAT_DISABLED`; README endpoint table (503).

## Task 2: alert logic (pure) + script

- Files: `apps/worker/scripts/alerts.mjs` (new), `apps/worker/test/alerts-script.spec.ts` (new, mirrors `eval-script.spec.ts`).
- Models (exported): `THRESHOLDS = { failedRate: 0.1, p95Ms: 15000, failoverRate: 0.3, budgetUsed: 0.8, blockedFactor: 3, minRequests: 20 }`;
  `evaluate(metrics, thresholds = THRESHOLDS): AlertCheck[]` with
  `metrics = { total, failed, p95Ms, failovers, generations, dailyLimit, blocked, blockedAvg7d }`;
  `buildQuery(windowHours): string` (Analytics Engine SQL over `ai_ling_chat`, blob4=outcome, double1=latency, double3=failovers);
  `queryAnalytics(fetchFn, { accountId, token, sql })`; `renderIssue(checks): { title, body }`.
- RED: the scenarios above at, below and above each threshold; `minRequests` guard; `buildQuery` contains the dataset and window;
  `queryAnalytics` sends `Authorization: Bearer`, POSTs to `/accounts/{id}/analytics_engine/sql`, throws on non-200;
  `renderIssue` lists only breached checks.
- GREEN: pure functions first; `main()` (guarded like `eval.mjs`) runs 3 queries (1 h window, today's generations, 7-day blocked average),
  prints a JSON `{ breached, checks }` to stdout and a GitHub step output, exits 0 (alerting is the workflow's job).
- Assumption: `DAILY_GENERATION_LIMIT` is read from `wrangler.jsonc`-matching constant passed by the workflow env (`DAILY_LIMIT: 1000`) to avoid parsing JSONC.

## Task 3: alert workflow

- Files: `.github/workflows/ai-ling-alerts.yml` (new), `.github/workflows/eval-worker.yml` (nightly job opens/comments on the issue on failure).
- Design: `on: schedule: '17 * * * *'` + `workflow_dispatch`; `permissions: { contents: read, issues: write }`; steps: checkout, node 24,
  `node apps/worker/scripts/alerts.mjs`, then `gh issue` (preinstalled, `GH_TOKEN: ${{ github.token }}`) to find the open `ai-ling-alert`
  issue → create / comment / close. Secrets: `CF_ANALYTICS_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
  The shared open/comment/close shell lives once in `.github/scripts/alert-issue.sh` and is called by both workflows.
- Verify: YAML parses (`node -e` with the repo's `yaml` if present, otherwise `python -c yaml.safe_load`); a spec asserts the workflow has
  `issues: write` and nothing broader. Real behaviour is verified by a manual `workflow_dispatch` after merge (needs your secret, see below).

## Task 4: nightly eval + larger injection set

- Files: `.github/workflows/eval-worker.yml`, `apps/worker/scripts/eval.mjs`, `apps/worker/test/eval-script.spec.ts`.
- RED: `EVAL_QUESTIONS` contains injection cases for: forged-history jailbreak (needs `history` support in eval items →
  `item.history`), link injection, cache-poisoning attempt, system-prompt extraction in `de` and `th`; all flagged `injection: true`
  and graded by existing `grade` (no leaked prompt text, no attacker host).
- GREEN: `ask()` passes `item.history`; new items; `schedule: cron '30 2 * * *'` on `eval-worker.yml` against production with `--delay 7000`.
- Note: forged history is dropped by the signature check, so the case asserts the jailbreak does not take effect.

## Task 5: supply chain

- Files: every `.github/workflows/*.yml`, `.github/dependabot.yml` (new), `deploy-worker.yml`, `deploy-ui.yml`.
- Do: pin each `uses:` to a commit SHA with the tag in a trailing comment (resolved with `gh api repos/<o>/<r>/git/ref/tags/<tag>`;
  annotated tags dereferenced); Dependabot weekly, grouped, for `github-actions` and `npm` (root `/`, pnpm workspace);
  `pnpm audit --prod --audit-level=high` step in both deploy workflows before deploy.
- Verify: a spec/grep check that no `uses:` lacks a 40-hex SHA; `pnpm audit --prod --audit-level=high` run locally first —
  if it already fails, I report it and don't silently ignore it.

## Task 6: staging and gradual deploy (needs your input first, see questions)

- Files: `apps/worker/wrangler.jsonc` (`env.staging`), `.github/workflows/eval-worker.yml` (PR job), `deploy-worker.yml`.
- Design: `env.staging` with its own `name`, Vectorize index `resume-rag-staging`, D1 `thanikc-cache-staging`, own rate-limit namespace ids;
  PR job: `wrangler versions upload --env staging` → preview URL → ingest + `eval.mjs` against that URL. Production:
  `wrangler versions upload` then `wrangler versions deploy <id>@10% ` → verify → `@100%`.
- Risk: gradual deployment mixes two versions for a while; the cache clear and re-ingest steps still run after 100 %. Secrets
  on a versioned upload are inherited from the worker, so staging needs its own `wrangler secret put --env staging`.

## Task 7: runbook

- Files: `apps/worker/RUNBOOK.md` (new), link from `apps/worker/README.md`.
- Content per spec §6.4: key rotation, provider outage via vars, cache purge, orphan-vector cleanup, kill switch (`CHAT_DISABLED=true`
  via dashboard var or `wrangler deploy --var`), payment-method check for each of the four accounts, scoped-token recipe
  (Workers Scripts, D1, Vectorize edit; separate deploy and ingest tokens), SLO (99 % of valid requests 200 within 15 s) and the Analytics query that measures it.

## Done criteria

Worker suite green; `alerts.mjs` and eval spec green; all workflows parse and are SHA-pinned; `pnpm audit` result reported.
Not verifiable from here: live alert issue creation, staging deploy, token scoping (all need your Cloudflare/GitHub secrets).
