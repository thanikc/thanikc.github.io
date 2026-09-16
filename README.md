# thanikc

pnpm monorepo for [thanikc.github.io](https://thanikc.github.io):

- **`apps/ui`** — personal portfolio site built with Angular (Standalone, Signals,
  Angular Material, Tailwind CSS). Full-Stack Engineer profile, an interactive
  retirement calculator that uses live World Bank API data for nest-egg projections,
  and AI Ling (floating chat widget on every page, answering about Thanik and his
  work) that asks `apps/worker`. Published in English, German and Thai. Deploys to
  GitHub Pages.
- **`apps/worker`** — Cloudflare Worker API backing AI Ling: RAG over a
  Vectorize index (Workers AI embeddings) with a Groq → Google AI → OpenRouter
  provider chain. Deploys to Cloudflare. See [`apps/worker/README.md`](apps/worker/README.md).

## Project Structure

```text
apps/
├── ui/
│   ├── src/app/
│   │   ├── domains/                 # Domain-driven feature modules
│   │   │   ├── ads/                 # Ads domain (Google AdSense)
│   │   │   ├── chat/                # AI Ling chat widget (calls apps/worker)
│   │   │   ├── profile/             # Portfolio / profile domain
│   │   │   ├── privacy/             # Privacy policy
│   │   │   └── retirement-calculator/
│   │   ├── shared/                  # Cross-domain reusable UI + layout
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── locale/                      # messages.de.json / messages.th.json
│   ├── public/                      # Static assets & images
│   ├── scripts/                     # Deployment root, translation check, static server
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
pnpm --filter @thanikc/ui start           # dev server (English) → http://localhost:4200
pnpm --filter @thanikc/ui test            # unit tests (Vitest)
pnpm --filter @thanikc/ui build:pages     # all three locales + the deployment root
pnpm --filter @thanikc/ui i18n:check      # every message translated, placeholders intact

# Worker (apps/worker)
pnpm --filter @thanikc/worker dev         # wrangler dev → http://localhost:8787
pnpm --filter @thanikc/worker test
pnpm --filter @thanikc/worker deploy

pnpm -r test                              # every package
pnpm format                               # prettier across apps/
```

## Languages

The site is published in English, German and Thai with Angular's compile-time i18n,
which means **one complete build per language**, each served from its own subpath:

```text
https://thanikc.github.io/            → picks a language, then redirects
https://thanikc.github.io/en/         → English (source locale)
https://thanikc.github.io/de/         → German
https://thanikc.github.io/th/         → Thai
```

- **Which language a visitor gets:** an explicit choice from the header selector
  (kept in `localStorage`, key `preferred-language`) wins; otherwise the first of the
  browser's languages the site is built in; otherwise English. That decision runs in
  the redirect page at the root, so it costs nothing on the language pages
  themselves. A locale URL is always honoured as-is — a `/de/` link opens in German.
- **Old and unknown URLs:** `404.html` at the root applies the same rule while keeping
  the requested route, so the pre-i18n URLs (`/calculator`, `/privacy-policy`) and any
  shared deep link still land on the right page.
- **Adding or changing a string:** mark it `i18n="description@@some.id"` in a template
  or `` $localize`:description@@some.id:text` `` in TypeScript, then add the `some.id`
  entry to `apps/ui/src/locale/messages.de.json` and `messages.th.json` and run
  `pnpm --filter @thanikc/ui i18n:check`. An untranslated message silently falls back
  to English, which is what that check exists to catch.
- **Deploying:** `build:pages`, not `build` — the localized build leaves the
  deployment root empty, and `apps/ui/scripts/emit-pages-root.mjs` fills it in with the
  redirect pages and the files that only work at the root of a domain (`robots.txt`,
  `sitemap.xml`, `ads.txt`, `llms.txt`, `favicon.ico`).

## Key Features & Standards

- **Accessibility (a11y) & Semantic HTML**: screen-reader friendly elements, keyboard
  navigation, and ARIA guidelines.
- **Domain-Driven Architecture**: each feature is self-contained with its own data
  services, state, components, and models.
- **Signal-Based Reactive State**: calculations and external API data streams are
  managed reactively with Angular Signals.
- **TDD**: strict red/green/refactor in both apps — see [`AGENTS.md`](AGENTS.md).
- **Internationalization**: compile-time Angular i18n, one build per locale, with the
  canonical and `hreflang` links of every route written into the prerendered HTML.

## Deployment

Push to `main`. `deploy-ui.yml` runs `build:pages` for `apps/ui` and publishes to GitHub Pages;
`deploy-worker.yml` tests and `wrangler deploy`s `apps/worker` (needs
`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and the provider-key repo secrets).
Each workflow is path-filtered to its own app.
