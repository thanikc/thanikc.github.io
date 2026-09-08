# thanikc

pnpm monorepo for [thanikc.github.io](https://thanikc.github.io):

- **`apps/ui`** — personal portfolio site built with Angular (Standalone, Signals,
  Angular Material, Tailwind CSS). Full-Stack Engineer profile plus an interactive
  retirement calculator that uses live World Bank API data for nest-egg projections.
  Deploys to GitHub Pages.
- **`apps/worker`** — Cloudflare Worker API backing the resume chatbot: RAG over a
  Vectorize index (Workers AI embeddings) with a Groq → Google AI → OpenRouter
  provider chain. Deploys to Cloudflare. See [`apps/worker/README.md`](apps/worker/README.md).

## Project Structure

```text
apps/
├── ui/
│   ├── src/app/
│   │   ├── domains/                 # Domain-driven feature modules
│   │   │   ├── ads/                 # Ads domain (Google AdSense)
│   │   │   ├── profile/             # Portfolio / profile domain
│   │   │   ├── privacy/             # Privacy policy
│   │   │   └── retirement-calculator/
│   │   ├── shared/                  # Cross-domain reusable UI + layout
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── public/                      # Static assets & images
│   └── angular.json
└── worker/
    ├── src/                         # Hono app, RAG, chat provider chain, ingest
    ├── test/
    └── wrangler.jsonc
```

## Commands

```bash
pnpm install                              # bootstrap the workspace

# UI (apps/ui)
pnpm --filter @thanikc/ui start           # dev server → http://localhost:4200
pnpm --filter @thanikc/ui test            # unit tests (Vitest)
pnpm --filter @thanikc/ui build --configuration=production

# Worker (apps/worker)
pnpm --filter @thanikc/worker dev         # wrangler dev → http://localhost:8787
pnpm --filter @thanikc/worker test
pnpm --filter @thanikc/worker deploy

pnpm -r test                              # every package
pnpm format                               # prettier across apps/
```

## Key Features & Standards

- **Accessibility (a11y) & Semantic HTML**: screen-reader friendly elements, keyboard
  navigation, and ARIA guidelines.
- **Domain-Driven Architecture**: each feature is self-contained with its own data
  services, state, components, and models.
- **Signal-Based Reactive State**: calculations and external API data streams are
  managed reactively with Angular Signals.
- **TDD**: strict red/green/refactor in both apps — see [`AGENTS.md`](AGENTS.md).

## Deployment

Push to `main`. `deploy-ui.yml` builds `apps/ui` and publishes to GitHub Pages;
`deploy-worker.yml` tests and `wrangler deploy`s `apps/worker` (needs
`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and the provider-key repo secrets).
Each workflow is path-filtered to its own app.
