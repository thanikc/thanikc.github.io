# @thanikc/worker

Cloudflare Worker API backing AI Ling, the assistant that answers about Thanik and
his work. It runs RAG over a
[Vectorize](https://developers.cloudflare.com/vectorize/) index of content
(embedded with Workers AI `@cf/baai/bge-m3`) and generates answers through
an OpenAI-compatible provider chain: **Groq** primary, **Google AI** and
**OpenRouter** as fallbacks.

Live at **https://thanikc-worker.thanikc.workers.dev** (`/api/health` → `{ "status": "ok" }`).
The Angular chat widget (`apps/ui/src/app/domains/chat/`) reads this URL from the
`CHAT_API_URL` token in `app.config.ts`, and `http://localhost:8787` in dev mode.

## Endpoints

| Method | Path          | Purpose                                                                                                                                        |
| ------ | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/health` | Liveness check → `{ "status": "ok" }`                                                                                                          |
| POST   | `/api/chat`   | `{ message, history?, locale? }` → `{ answer, provider, sources, answerSig? }` (RAG)                                                           |
| POST   | `/api/ingest` | `Bearer <expires>.<hmac(INGEST_TOKEN)>` (10 min, `pnpm ingest` mints it); `{ id, text, metadata? }` (`id` = `[a-z0-9-]{1,64}`) → upsert chunks |

Bodies are capped (chat 32 KiB, ingest 1 MiB → 413). An unknown `locale` or more than 6 `history`
turns → 400. With `SESSION_SECRET` set, each answer carries `answerSig` (HMAC of the answer) and
assistant turns in `history` without a valid one are dropped with the user turn before them.

CORS allows `ALLOWED_ORIGIN` (comma-separated). For local UI work, put
`ALLOWED_ORIGIN=https://thanikc.github.io,http://localhost:4200` in `.env` (alongside the provider keys; `wrangler dev` reads `.env` only when no `.dev.vars` exists).

### Answer language

`locale` is the language the visitor is reading the site in (`en`, `de` or `th` — see
the i18n section of the root README). `buildMessages` adds a language instruction to
the system prompt for `de` and `th`, and English needs none. It is visitor input, so
anything other than a language the site is published in is ignored rather than
reaching the prompt.

The knowledge base in `content/` stays English, but retrieval doesn't need it to
match: the embedding model (`@cf/baai/bge-m3`) is multilingual, so a question typed
in German or Thai embeds into the same space as the English chunks and retrieves
comparably to an English question. Switching `EMBEDDING_MODEL` to a different model
needs the Vectorize index recreated at the new dimension and every document
re-ingested (`pnpm ingest:deployed`), so treat that as a deliberate migration, not a
config tweak.

`/api/chat` returns the full answer in one response rather than streaming tokens.
This is deliberate: the provider chain in `chat/client.ts` fails over from Groq to
Google AI to OpenRouter on error, and that only works cleanly while the response is
still buffered — once tokens are streaming to the browser, a mid-stream provider
failure can't be retried without producing a garbled, truncated answer.

## Configuration

`wrangler.jsonc` declares the bindings (`AI`, `VECTORIZE`) and non-secret `vars`
(allowed origin, model ids). Secrets are **not** committed:

```
GROQ_API_KEY  GOOGLE_AI_API_KEY  OPENROUTER_API_KEY  INGEST_TOKEN
TURNSTILE_SECRET  SESSION_SECRET
```

Set them locally with `pnpm exec wrangler secret put <NAME>`, or in CI via the
`deploy-worker.yml` `secrets:` block (GitHub repo secrets of the same name, plus
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`).

`/api/chat` requires a Cloudflare Turnstile token (`X-Turnstile-Token`) or a session from a
previous verification (`X-Chat-Session`, 15 minutes, returned in the response) once **both**
`TURNSTILE_SECRET` and `SESSION_SECRET` are set; with either missing the gate is off. In
`.dev.vars` use Cloudflare's always-pass test secret, and any string for the session:

```
TURNSTILE_SECRET=1x0000000000000000000000000000000AA
SESSION_SECRET=local-dev-only
```

The eval workflow needs the same `SESSION_SECRET` as a GitHub repo secret so it can mint a session.

## One-time setup

```bash
pnpm exec wrangler vectorize create resume-rag --dimensions=1024 --metric=cosine
```

## Knowledge base

`content/*.md` holds the content AI Ling answers from — one file per
document. Every deploy of the worker (push to `main` touching `apps/worker/**`) re-ingests
the content afterwards. Ingest is idempotent: a document whose text and metadata hash to
what the index already holds is skipped without embedding, so an unchanged push costs
nothing. To re-ingest by hand:

```bash
# try it locally first
pnpm --filter @thanikc/worker dev          # in one terminal
pnpm --filter @thanikc/worker ingest       # → localhost:8787, reads INGEST_TOKEN from .env

# then production
pnpm --filter @thanikc/worker ingest:deployed
```

Upserts reach the index asynchronously: `sources` can stay stale for 1–3 minutes
after `/api/ingest` returns 200.

See `content/README.md` for the file format.

## Answer cache (D1)

`/api/chat` caches the opening message of a conversation in D1 (`CACHE_DB`, table
`answer_cache`). An exact repeat (case and whitespace ignored, per locale) is answered
before any embedding; otherwise the query embedding is compared with the newest 200
cached questions and a cosine similarity of 0.95 or more reuses that answer. Hits carry
`cached: 'exact' | 'semantic'`. Follow-ups (non-empty `history`) and declines are never
cached, and a missing or failing D1 just means no caching (a failure logs a warning). Unlike the Vectorize index,
a stored answer is reusable on the very next request.

```bash
pnpm exec wrangler d1 migrations apply CACHE_DB --remote   # CI also runs this before each deploy
```

An ingest that changes the index empties the cache, so answers grounded on old content
stop being served; a no-op ingest leaves it alone. CI also empties it on every deploy, so
a changed prompt or model takes effect at once. Vectorize applies upserts 1–3 minutes
late, so an answer cached in that window can still reflect the old content. The table
keeps the newest 1000 rows.

A daily generation budget (`DAILY_GENERATION_LIMIT`, table `generation_budget`, one row per
UTC day) caps uncached answers so the free provider quotas can't run dry. Once spent,
`/api/chat` answers with a polite "busy" message (`provider: 'none'`, outcome `budget`)
without calling a provider; cache hits and declines don't count. An absent var, binding or
a D1 error means no limit.

Removing or renaming a file in `content/` leaves its vectors in the index (Vectorize
cannot list by prefix); delete them with `wrangler vectorize delete-vectors`. A document
that merely shrinks has its stale tail chunks deleted automatically.

## Telemetry (Analytics Engine)

Each `/api/chat` request that passes validation writes one data point to the
`ai_ling_chat` dataset (`ANALYTICS` binding; absent = nothing recorded) and returns an
`X-Request-Id` header. Blobs: provider, locale, cache tier, outcome (`ok` / `refused` /
`failed` / `budget` / `blocked`), request id. Doubles: latency ms, top retrieval score (-1 = retrieval skipped),
failover depth, answer length. The question, answer and IP are never recorded.

```sql
-- POST https://api.cloudflare.com/client/v4/accounts/<id>/analytics_engine/sql
SELECT blob1 AS provider, blob4 AS outcome, count() AS n, quantileWeighted(0.95, double1, _sample_interval) AS p95_ms
FROM ai_ling_chat WHERE timestamp > NOW() - INTERVAL '7' DAY GROUP BY provider, outcome
```

Answer moderation: each answer is checked with Llama Guard via Workers AI before it is
cached or shown with links. It fails open (a moderation error lets the answer through);
the response shape is unverified and must be confirmed in the deployed eval. An answer
is admitted to the cache only if it is link-free, not truncated, scored >= `MIN_SCORE` + 0.05
and moderated safe.

## Commands (run from repo root or this directory)

```bash
pnpm --filter @thanikc/worker dev      # wrangler dev  → http://localhost:8787
pnpm --filter @thanikc/worker test     # vitest (Workers pool, bindings stubbed per-test)
pnpm --filter @thanikc/worker run deploy   # wrangler deploy
pnpm --filter @thanikc/worker cf-typegen  # regenerate worker-configuration.d.ts
```

## Tests

`vitest` runs inside the Workers runtime via `@cloudflare/vitest-plugin`. AI and
Vectorize have no local simulator, so `remoteBindings` is off and each test passes
an explicit `env` with stubbed `AI` / `VECTORIZE` and a stubbed global `fetch`
(`vi.stubGlobal`). Endpoint tests call the Hono app directly with
`app.request(url, init, env)`; `test/health.spec.ts` exercises the real worker
through `SELF`.
