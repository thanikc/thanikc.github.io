# Plan 03 — Answer cache on D1 (exact + semantic)

**Why:** repeat questions ("what does Thanik do?") re-pay embedding + retrieval +
generation every time. The cache lives in **D1**, not the Cache API and not a second
Vectorize index: D1 is global and durable (the Cache API is per-colo and evictable),
reads are immediately consistent (Vectorize upserts lag 1–3 min, so a fresh answer
was not reusable), and invalidation is a `WHERE` clause instead of index surgery.
The semantic tier reuses the query embedding `retrieve()` already computes, so a
fuzzy hit costs no extra inference. Ship the exact tier first; semantic is a separate
GREEN step.

**Touches:** `apps/worker/src/index.ts`, `apps/worker/src/rag.ts` (expose the
embedding), new `apps/worker/src/cache.ts`, new `apps/worker/migrations/0001_answer_cache.sql`,
`apps/worker/wrangler.jsonc`, `apps/worker/src/worker-env.d.ts`, new
`apps/worker/test/cache.spec.ts`.

## Setup

1. `wrangler d1 create thanikc-cache`; add the `d1_databases` binding `CACHE_DB` to
   `wrangler.jsonc` (with `migrations_dir`). Declare `CACHE_DB?: D1Database` in
   `worker-env.d.ts` — optional like `CHAT_LIMIT`: absent binding = no caching, so
   local dev and existing tests keep working untouched.
2. Migration `0001_answer_cache.sql`:

   ```sql
   CREATE TABLE answer_cache (
     key        TEXT PRIMARY KEY,   -- sha256(normalised question | locale)
     epoch      TEXT NOT NULL,      -- CACHE_EPOCH at write time
     question   TEXT NOT NULL,
     answer     TEXT NOT NULL,
     provider   TEXT NOT NULL,      -- replayed so a hit looks like the original
     sources    TEXT NOT NULL,      -- JSON [{title, score}]
     embedding  TEXT,               -- base64 Float32Array (D1 returns BLOBs as ~4x-bloated number arrays)
     created_at INTEGER NOT NULL    -- unix seconds
   );
   CREATE INDEX answer_cache_epoch ON answer_cache (epoch, created_at);
   ```

   Locale is part of the key **and** filtered on the semantic scan (add a `locale`
   column) — a German answer must never serve an English question.

## Tier 1 — exact match (do first)

3. RED: two identical `/api/chat` bodies → one provider `fetch`, second response
   carries `cached: 'exact'` and the same `answer` and `sources`.
4. GREEN: `cache.ts` exports `lookupExact(env, key)` / `store(env, row)`. Key =
   SHA-256 (`crypto.subtle`) of `message.trim().toLowerCase()` + `locale`. Look up
   **before** `retrieve()` so a hit skips embedding, Vectorize and generation.
   Only store successful generations — never a decline (`provider: 'none'`, the gate
   is already free) and never an error.
5. Best-effort: wrap every D1 call in try/catch and fall through to the normal path.
   A cache failure must never fail the request (RED: a `CACHE_DB` whose `prepare`
   throws still yields a normal answer).
6. Write with `c.executionCtx.waitUntil(store(...))` so the response does not wait on
   D1.

## Tier 2 — semantic match

7. Refactor `retrieve` to also return the query `vector` (or split `embed` out at the
   call site) — do **not** embed twice. Exact lookup happens before embedding, so on
   an exact miss the order is: embed → semantic lookup → (miss) retrieve with that
   same vector.
8. RED: a paraphrase whose stored embedding has cosine ≥ `CACHE_MIN_SIMILARITY`
   (export from `cache.ts`, start at 0.95) → `cached: 'semantic'`, no provider call.
   A paraphrase just under it → normal path.
9. GREEN: `lookupSemantic(env, vector, locale)` selects the newest N rows
   (`N = 200`) for the current epoch and locale, computes cosine in the worker, and
   returns the best row above the threshold. Store the embedding as
   base64 of `new Float32Array(vector).buffer` on write (not a BLOB: D1 reads those back
   as JSON number arrays). Compute full cosine — don't assume unit length.
   `// ponytail: linear scan over ≤200 rows; if the table outgrows that, move only the
   embeddings back to Vectorize`.
10. **No known lag:** unlike a Vectorize-backed cache, a stored answer is reusable on
    the next request (state this in the README as a contrast to the ingest note).

## Invalidation and hygiene

11. `CACHE_EPOCH` var (default `"1"`) is written to `epoch` and every lookup filters
    `epoch = ?`. Bump it on re-ingest (plan 06 step 5) so stale answers cannot outlive
    the content that grounded them. Skip the cache entirely (read and write) when
    `history.length > 0` — a follow-up's answer depends on the turns before it.
12. Bound the table: on write, `DELETE FROM answer_cache WHERE epoch != ? OR created_at < ?`
    (TTL 30 days). Rows from old epochs are dead weight, not correctness risks, so
    the purge is opportunistic.

**Done when:** repeat question served without a provider call, response reports the
cache tier, re-ingest invalidates, no double embedding, D1 outage degrades to the
uncached path.

**Non-goals:** Cache API, a second Vectorize index, KV, cross-colo tricks, cache
warming, tuning the threshold beyond one eval run, caching multi-turn answers.
