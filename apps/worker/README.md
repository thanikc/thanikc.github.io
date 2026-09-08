# @thanikc/worker

Cloudflare Worker API backing the resume chatbot. It runs RAG over a
[Vectorize](https://developers.cloudflare.com/vectorize/) index of résumé content
(embedded with Workers AI `@cf/baai/bge-base-en-v1.5`) and generates answers through
an OpenAI-compatible provider chain: **Groq** primary, **Google AI** and
**OpenRouter** as fallbacks.

## Endpoints

| Method | Path          | Purpose                                                           |
| ------ | ------------- | ----------------------------------------------------------------- |
| GET    | `/api/health` | Liveness check → `{ "status": "ok" }`                             |
| POST   | `/api/chat`   | `{ message, history? }` → `{ answer, provider, sources }` (RAG)   |
| POST   | `/api/ingest` | `Bearer $INGEST_TOKEN`; `{ id, text, metadata? }` → upsert chunks |

CORS allows `https://thanikc.github.io` and `http://localhost:4200`.

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
pnpm exec wrangler vectorize create resume-rag --dimensions=768 --metric=cosine
```

## Knowledge base

`content/*.md` holds the résumé content the chatbot answers from — one file per
document. Edit those, then re-ingest:

```bash
pnpm --filter @thanikc/worker dev          # in one terminal
pnpm --filter @thanikc/worker ingest       # → localhost:8787, reads INGEST_TOKEN from .env
pnpm --filter @thanikc/worker ingest -- --url https://thanikc-worker.<sub>.workers.dev
```

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
