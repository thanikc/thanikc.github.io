# Status — AI Ling enterprise hardening

Plans live in `.agents/plans/NN-*.md` and are immutable once written: read the plan
for the *what and why*, keep all progress here. Update only this file as work lands.
TDD per `AGENTS.md` (`pnpm --filter @thanikc/worker test`).

Updated: 2026-09-20

| Plan | Item                    | State   |
| ---- | ----------------------- | ------- |
| 01   | Rate limit + input cap  | todo    |
| 02   | Groundedness gate       | todo    |
| 07   | Trim sources payload    | todo    |
| 03   | Two-tier answer cache   | todo    |
| 04   | Telemetry               | todo    |
| 05   | Eval gate + injection   | todo    |
| 06   | Auto re-ingest          | todo    |

**Next:** plan 01, then 02. Together ~20 lines and they close the only gaps that are
live risks rather than polish. 07 is a 10-minute cleanup, take it when convenient.

**Order notes:** 03 step 8 and 06 step 5 share the `CACHE_EPOCH` bump — whichever
lands second wires it up. 02 must land before 03, or the cache stores answers the
gate would have refused.

**Done:** nothing yet. Record here as `plan NN — done <commit>`, one line, plus any
decision that contradicts the plan (e.g. a calibrated MIN_SCORE, a chosen orphan-vector
policy).
