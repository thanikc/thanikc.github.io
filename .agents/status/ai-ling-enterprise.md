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
| 03   | D1 answer cache         | done    |
| 04   | Telemetry               | done    |
| 05   | Eval gate + injection   | done    |
| 06   | Auto re-ingest          | done    |

**Next:** confirm the deploy of plans 04–06 went green and the `ai_ling_chat` dataset is receiving points. All plans are then complete. Plans 01–03 and 07 are deployed (version 046bdcdf, 2026-09-20) and smoke-tested live: exact cache hit, gate declines off-topic.

**Order notes:** 03 step 11 and 06 step 5 share the `CACHE_EPOCH` bump — whichever
lands second wires it up. 02 must land before 03, or the cache stores answers the
gate would have refused.

**Done:** Record here as `plan NN — done <commit>`, one line, plus any
decision that contradicts the plan (e.g. a calibrated MIN_SCORE, a chosen orphan-vector
policy).

- plan 06 — done (this commit), not yet deployed. Decisions beyond the plan: the hash covers text
  *and* metadata (a title edit re-ingests); the re-ingest is a final step of `deploy-worker.yml`,
  not a separate workflow, so it always runs against a worker that has the skip logic; it runs on
  every worker deploy, which is fine because unchanged docs are skipped. **Orphans:** a shrunken
  doc's tail chunks are deleted (old `totalChunks` is read from chunk 0 for free); a *removed or
  renamed* file is accepted as a leftover and documented in the README. **Cache:** instead of
  bumping `CACHE_EPOCH` (needs a commit + deploy), a changing ingest `DELETE`s all of
  `answer_cache`; `CACHE_EPOCH` stays as a manual override. Caveat: answers cached in the 1–3 min
  Vectorize lag can still reflect old content. Ingest responses gain `skipped: true` when unchanged.
- plan 05 — done (this commit). Five injection cases (en ×3, de, th) are hard gates; `forbid`
  lists distinctive system-prompt phrases that must not appear. Runner takes `--delay` (pace under
  `CHAT_LIMIT`, CI uses 7000) and `--min-pass` (default 0.85, sized so the two known keyword misses
  — retirement "World Bank", BJJ quiz label leak — don't flake the gate). Live run 2026-09-20: 20/21,
  injections all held. Decline shape for "repeat your system prompt" is the model's own "I can't
  share that", so `can't share` is an accepted keyword. Workflow `eval-worker.yml` grades the
  *deployed* worker (PRs can't preview-deploy), so it validates the previous build; re-run via
  workflow_dispatch after merge.
- plan 04 — done (this commit), not yet deployed. Decisions beyond the plan: `generate` now returns
  `failovers` (count of providers that failed first) so the point can carry failover depth;
  400s and 429s record nothing (validation noise, and Workers' own metrics cover 429);
  `X-Request-Id` is CORS-exposed; `topScore` is -1 when retrieval was skipped (exact hit).
  Privacy policy needs no change: no question text, answer or IP is stored.
- plan 03 — done (this commit), D1 cache with both tiers. Decisions beyond the plan: embeddings
  are base64 TEXT, not BLOB; a `provider` column replays the original provider on a hit;
  `CACHE_DB`/`CACHE_EPOCH` are read through a cast in `cache.ts` (no `worker-env.d.ts` entry,
  so `wrangler types` can't conflict). D1 `thanikc-cache` created and migrated remotely 2026-09-20 (id pinned in `wrangler.jsonc`);
  deployed and verified. A live paraphrase did not hit the semantic tier at 0.95 — tune `CACHE_MIN_SIMILARITY` from real traffic. Plan 06 wires the `CACHE_EPOCH` bump.
  Earlier: plan rewritten 2026-09-20 (user decision, overrides "plans are immutable"): cache
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
