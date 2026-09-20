# Status — AI Ling enterprise hardening

Plans live in `.agents/plans/NN-*.md` and are immutable once written: read the plan
for the *what and why*, keep all progress here. Update only this file as work lands.
TDD per `AGENTS.md` (`pnpm --filter @thanikc/worker test`).

Updated: 2026-09-20

| Plan | Item                    | State   |
| ---- | ----------------------- | ------- |
| 01   | Rate limit + input cap  | done    |
| 02   | Groundedness gate       | partial |
| 07   | Trim sources payload    | done    |
| 03   | Two-tier answer cache   | todo    |
| 04   | Telemetry               | todo    |
| 05   | Eval gate + injection   | todo    |
| 06   | Auto re-ingest          | todo    |

**Next:** plan 02 step 5 (calibrate `MIN_SCORE`, needs a live eval run), then 03.

**Order notes:** 03 step 8 and 06 step 5 share the `CACHE_EPOCH` bump — whichever
lands second wires it up. 02 must land before 03, or the cache stores answers the
gate would have refused.

**Done:** Record here as `plan NN — done <commit>`, one line, plus any
decision that contradicts the plan (e.g. a calibrated MIN_SCORE, a chosen orphan-vector
policy).

- plan 07 — done (this commit). `sources` is now `{ title, score }[]`; no decisions beyond the plan.
- plan 02 — steps 1–4 done, step 5 **not run**: `MIN_SCORE` is still the uncalibrated 0.4
  and must not ship before `node scripts/eval.mjs` confirms no golden-set question
  falls under it. Decisions beyond the plan: the gate applies only when `history` is
  empty (a "tell me more" follow-up embeds poorly but is grounded by the
  conversation); the decline copy is generic (also reads fine for a bare "hi") and
  exists in en/de/th. Note the eval script sends 16 requests from one IP and plan 01's
  limit is 10/min, so run it against a worker without `CHAT_LIMIT` or pace it.
- plan 01 — done d49590b. Rate limit runs first in the handler, before body
  parsing. `CHAT_LIMIT` is declared optional in `src/worker-env.d.ts` (absent = allow);
  if `cf-typegen` is re-run it will emit a non-optional `CHAT_LIMIT: RateLimit` that
  conflicts — delete the manual line then.
