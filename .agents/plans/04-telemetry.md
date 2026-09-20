# Plan 04 — Structured telemetry via Analytics Engine

**Why:** `observability.enabled` gives logs, not answers. One data point per request
turns "I built a chatbot" into "here is what visitors ask, which provider is degrading,
my p95, my cache hit rate, and what it costs" — the operational half of enterprise-grade.

**Touches:** `apps/worker/src/index.ts`, new `apps/worker/src/telemetry.ts`,
`apps/worker/wrangler.jsonc`, new `apps/worker/test/telemetry.spec.ts`.

## Steps

1. Binding (native, free at this volume, no dependency):
   ```jsonc
   "analytics_engine_datasets": [{ "binding": "ANALYTICS", "dataset": "ai_ling_chat" }]
   ```
2. RED: a successful `/api/chat` calls `ANALYTICS.writeDataPoint` once with the
   provider name and latency; a failed-chain request records the failure; a missing
   binding must not throw.
3. GREEN: one `writeDataPoint` at the end of the chat handler:
   - `blobs`: provider, locale, cache tier, outcome (`ok` / `refused` / `failed`)
   - `doubles`: total latency ms, retrieval top score, failover depth, answer length
   - `indexes`: `[provider]` (only one index allowed)
   Limits are 20 blobs / 20 doubles / 1 index.
4. **Do not log the question text or the IP.** The privacy policy
   (`apps/ui/src/app/domains/privacy/privacy-policy.component.html`) is a factual
   inventory — if anything identifying is ever recorded, that page changes in the same
   commit. Aggregate metrics only is the cheaper and more defensible choice.
5. Echo a request id (`crypto.randomUUID()`) in an `X-Request-Id` response header and
   include it in the data point, so a reported bad answer can be traced.

**Done when:** a point per request, dashboard-queryable, nothing personal recorded,
worker still runs with the binding absent.

**Non-goals:** a UI dashboard, token/cost accounting per provider, log shipping,
alerting.
