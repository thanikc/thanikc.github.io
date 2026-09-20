# Plan 03 — Two-tier answer cache

**Why:** repeat questions ("what does Thanik do?") re-pay embedding + retrieval +
generation every time. Tier 1 is trivial; tier 2 is the part worth showing — it reuses
the query embedding `retrieve()` already computes, so semantic lookup costs no extra
inference. Ship tier 1 first; tier 2 is a separate GREEN step.

**Touches:** `apps/worker/src/index.ts`, new `apps/worker/src/cache.ts`,
`apps/worker/wrangler.jsonc`, new `apps/worker/test/cache.spec.ts`.

## Tier 1 — exact match (do first)

1. RED: two identical `/api/chat` bodies → one provider `fetch`, second response
   carries `cached: 'exact'`.
2. GREEN: `caches.default`, keyed on a SHA-256 of `message.trim().toLowerCase()` +
   `locale` + history length. The Cache API needs a GET request as key, so build a
   synthetic one: `new Request('https://cache.local/chat/' + hash)`. Only cache 200s.
3. Cache is per-colo and best-effort — never let a cache read/write failure fail the
   request.

## Tier 2 — semantic match

4. A second Vectorize index (`resume-qa-cache`, 1024 dims, cosine) storing past
   questions, with the answer in metadata.
5. On a tier-1 miss, query it with the vector `retrieve()` already produced (refactor
   `retrieve` to return `{ chunks, vector }` or split `embed` out at the call site —
   do **not** embed twice). Hit above ~0.95 similarity → return with `cached: 'semantic'`.
6. On a miss, upsert `{ question, answer, epoch }` after a successful generation.
7. **Known lag:** Vectorize upserts land asynchronously (1–3 min, same caveat as the
   README's ingest note), so a fresh Q&A is not immediately reusable. Acceptable for a
   cache — it warms slowly — but state it in the README rather than hiding it.

## Invalidation

8. A `CACHE_EPOCH` var mixed into the key and stored in cache metadata; bump it on
   re-ingest (see plan 06) so stale answers can't outlive the content that grounded
   them. Also skip the cache entirely when `history.length > 0` — a follow-up
   question's answer depends on the turns before it.

**Done when:** repeat question served without a provider call, response reports the
cache tier, re-ingest invalidates, no double embedding.

**Non-goals:** KV or D1 as a cache store, cross-colo consistency, cache warming,
tuning the threshold beyond one eval run.
