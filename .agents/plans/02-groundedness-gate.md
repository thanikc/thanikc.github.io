# Plan 02 — Refuse before the model call when retrieval is weak

**Why:** every off-topic question ("write me quicksort") currently pays for a full
LLM round trip just to be declined by a prompt instruction. Retrieval already knows
the knowledge base has no answer — the top score says so. Gating on it cuts cost and
adds a second, non-model line of defence against ungrounded answers. Belt and braces
with the scope rule in `buildMessages`, not a replacement for it.

**Touches:** `apps/worker/src/index.ts`, `apps/worker/src/rag.ts`,
`apps/worker/test/chat.spec.ts`.

## Steps

1. RED: `/api/chat` with a stubbed VECTORIZE returning no matches → 200 with the
   fallback answer, `provider: 'none'`, and **no** provider `fetch`.
2. RED: same with a single match scoring below threshold → same result.
3. RED: a match above threshold still goes to the provider (existing behaviour).
4. GREEN: export `MIN_SCORE` (start at 0.4) from `rag.ts`; in `index.ts` after
   `retrieve()`, short-circuit when `chunks.length === 0 || (chunks[0]?.score ?? 0) < MIN_SCORE`.
   Return the same upbeat "not in my knowledge base, ask Thanik directly" copy the
   system prompt describes, in the requested locale if cheap — otherwise English.
5. Calibrate: run `scripts/eval.mjs` and confirm no in-scope question in the golden
   set falls under the threshold. Adjust MIN_SCORE from that run, not from taste.

**Done when:** off-topic questions answer without a provider call, every golden-set
question still reaches the model, eval pass rate unchanged.

**Non-goals:** a second LLM as judge, per-question dynamic thresholds, reranking.
