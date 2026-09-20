# Status — AI Ling enterprise hardening

Plans live in `.agents/plans/NN-*.md` and are immutable once written: read the plan
for the *what and why*, keep all progress here. Update only this file as work lands.
TDD per `AGENTS.md` (`pnpm --filter @thanikc/worker test`).

Updated: 2026-09-20

| Plan | Item                    | State   |
| ---- | ----------------------- | ------- |
| 01   | Rate limit + input cap  | done    |
| 02   | Groundedness gate       | done    |
| 07   | Trim sources payload    | done    |
| 03   | D1 answer cache         | todo    |
| 04   | Telemetry               | todo    |
| 05   | Eval gate + injection   | todo    |
| 06   | Auto re-ingest          | todo    |

**Next:** plan 03. Deploy the worker first — the deployed one predates plan 02, so the gate is not live yet.

**Order notes:** 03 step 8 and 06 step 5 share the `CACHE_EPOCH` bump — whichever
lands second wires it up. 02 must land before 03, or the cache stores answers the
gate would have refused.

**Done:** Record here as `plan NN — done <commit>`, one line, plus any
decision that contradicts the plan (e.g. a calibrated MIN_SCORE, a chosen orphan-vector
policy).

- plan 03 — plan rewritten 2026-09-20 (user decision, overrides "plans are immutable"): cache
  moved from Cache API + Vectorize to **D1** (`CACHE_DB`, optional binding, semantic tier
  = cosine scan in the worker). Still needs `CACHE_EPOCH` for plan 06; run `wrangler d1 create`
  and apply the migration before deploying.
- plan 07 — done (this commit). `sources` is now `{ title, score }[]`; no decisions beyond the plan.
- plan 02 — done (this commit). Step 5 run 2026-09-20 against the deployed worker
  (paced 7s, its pre-gate build so every question reached the model and reported
  its top score): in-scope top scores 0.539–0.743, off-topic quicksort 0.431.
  `MIN_SCORE` 0.4 → **0.48**: 0.4 would not have declined the quicksort. Only one
  off-topic sample, so add more if false accepts show up in telemetry. Decisions
  beyond the plan: the gate applies only when `history` is empty (a "tell me more"
  follow-up embeds poorly but is grounded by the conversation); the decline copy is
  generic (also reads fine for a bare "hi") and exists in en/de/th. The eval script
  sends 16 requests from one IP and plan 01's limit is 10/min, so run it against a
  worker without `CHAT_LIMIT` or pace it. Eval pass rate was 14/16: BJJ Belt Quiz
  answered "User Safety: safe" (OpenRouter free model leaking a moderation label);
  retirement calculator answer missed the keyword "World Bank" — both pre-existing,
  not caused by the gate.
- plan 01 — done d49590b. Rate limit runs first in the handler, before body
  parsing. `CHAT_LIMIT` is declared optional in `src/worker-env.d.ts` (absent = allow);
  if `cf-typegen` is re-run it will emit a non-optional `CHAT_LIMIT: RateLimit` that
  conflicts — delete the manual line then.
