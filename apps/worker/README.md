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

| Method | Path          | Purpose                                                                   |
| ------ | ------------- | ------------------------------------------------------------------------- |
| GET    | `/api/health` | Liveness check → `{ "status": "ok" }`                                     |
| POST   | `/api/chat`   | `{ message, history?, locale? }` → `{ answer, provider, sources }` (RAG)  |
| POST   | `/api/ingest` | `Bearer $INGEST_TOKEN`; `{ id, text, metadata? }` → upsert chunks         |

CORS allows `https://thanikc.github.io` and `http://localhost:4200`.

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
```

Set them locally with `pnpm exec wrangler secret put <NAME>`, or in CI via the
`deploy-worker.yml` `secrets:` block (GitHub repo secrets of the same name, plus
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`).

## One-time setup

```bash
pnpm exec wrangler vectorize create resume-rag --dimensions=1024 --metric=cosine
```

## Knowledge base

`content/*.md` holds the content AI Ling answers from — one file per
document. Pushing content does **not** re-ingest it; after editing, re-ingest by hand:

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

## Commands (run from repo root or this directory)

```bash
pnpm --filter @thanikc/worker dev      # wrangler dev  → http://localhost:8787
pnpm --filter @thanikc/worker test     # vitest (Workers pool, bindings stubbed per-test)
pnpm --filter @thanikc/worker deploy   # wrangler deploy
pnpm --filter @thanikc/worker cf-typegen  # regenerate worker-configuration.d.ts
```

## Tests

`vitest` runs inside the Workers runtime via `@cloudflare/vitest-plugin`. AI and
Vectorize have no local simulator, so `remoteBindings` is off and each test passes
an explicit `env` with stubbed `AI` / `VECTORIZE` and a stubbed global `fetch`
(`vi.stubGlobal`). Endpoint tests call the Hono app directly with
`app.request(url, init, env)`; `test/health.spec.ts` exercises the real worker
through `SELF`.
