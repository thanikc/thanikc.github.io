# Plan 01 — Rate limit + input cap on /api/chat

**Why:** `/api/chat` is unauthenticated and unmetered, fronting three paid LLM keys.
A curl loop burns the quota. Cost control is the first thing an enterprise reviewer
looks for and the only gap here that is a live risk, not a nice-to-have.

**Touches:** `apps/worker/src/index.ts`, `apps/worker/wrangler.jsonc`,
`apps/worker/test/chat.spec.ts` (or a new `rate-limit.spec.ts`).

## Steps

1. RED: test that a second request with the same `CF-Connecting-IP` returns 429
   when the stubbed `CHAT_LIMIT.limit()` resolves `{ success: false }`, and that
   no provider `fetch` happened.
2. RED: test that `message` longer than 2000 chars returns 400 before retrieval.
3. GREEN: in `index.ts`, before `retrieve()`:
   - length cap next to the existing empty-`message` check;
   - `const { success } = await c.env.CHAT_LIMIT.limit({ key: c.req.header('cf-connecting-ip') ?? 'anon' })`
     → `429 { error: 'rate limited' }`.
4. Add the binding to `wrangler.jsonc` (native, no dependency). Shape as of
   wrangler 4 — re-check against `node_modules/wrangler/config-schema.json`:
   ```jsonc
   "ratelimits": [
     { "name": "CHAT_LIMIT", "namespace_id": "1001", "simple": { "limit": 10, "period": 60 } }
   ]
   ```
   `period` accepts only 10 or 60. Add `CHAT_LIMIT` to `src/worker-env.d.ts` /
   regenerate with `cf-typegen`.
5. Guard the binding being absent (local dev, tests that don't stub it): treat a
   missing `CHAT_LIMIT` as "allow", so the worker still runs without it.

**Done when:** 429 on burst, 400 on oversized input, existing chat tests still green,
`/api/health` and `/api/ingest` unaffected.

**Non-goals:** auth, per-user quotas, a paid bot-management product, CAPTCHA.
