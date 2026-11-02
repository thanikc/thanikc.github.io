# Rule: Angular TDD & Clean Code Workflow

## Monorepo

pnpm workspace (`apps/*`); root holds only prettier/husky/lint-staged.

- `apps/ui` (`@thanikc/ui`) — Angular site; all rules below apply. Run `pnpm --filter @thanikc/ui <test|build|start|…>`.
- `apps/worker` (`@thanikc/worker`) — Cloudflare Worker API for AI Ling, the assistant that answers about Thanik and his work (Hono + Vectorize RAG + Groq/Google/OpenRouter). Specs in `test/*.spec.ts` (vitest + `@cloudflare/vitest-plugin`); stub `AI`/`VECTORIZE` bindings and global `fetch` per test; drive endpoints via `app.request(url, init, env)`. See `apps/worker/README.md`.

## TDD Workflow

Stack: Angular v22+, Standalone, Signals, `inject()`, `@if`/`@for`, Material, Tailwind. Run tests yourself at every step without asking (`pnpm --filter @thanikc/<ui|worker> test`); report failures with actual output.

1. **RED**: write only the `*.spec.ts`; confirm it fails for the expected reason.
2. **GREEN**: minimal implementation until green.
3. **REFACTOR**: clean-code/DRY/Signal optimizations, behavior unchanged; summarize in 1 sentence.

Output: concise, code first, 1–2 sentence summary per step, no preambles.

## Architecture

- Domain-driven layout (`portfolio/`, `retirement-calculator/`, `shared/`); UI, state and API layers strictly isolated.
- Smart components own state/orchestration; dumb components own markup and events.
- SOLID, expressive names, small pure functions, immutable Signal state, no side effects.
- Tests: Vitest (`ng test`), explicit `vi.fn()` mocks; no Jasmine/Karma globals.

## Plans

Plans must include: (1) exact target file paths; (2) explicit TS models, `input<T>()`, `output<T>()`, `signal<T>()`; (3) RED specs (with `vi` mocks), GREEN method signatures and control flow, REFACTOR goals. No generic summaries.

## i18n (apps/ui)

Built three times (en source, de, th), served from `/en/`, `/de/`, `/th/` (`i18n` block in `angular.json`). `ng serve`/`ng test` are English-only.

- **Mark every user-facing string** with an explicit `@@id` (otherwise ids derive from text and copy edits silently drop translations): `i18n="meaning@@area.key"`, `i18n-<attr>=`, or `` $localize`:meaning@@area.key:text` ``.
- **`i18n-` only works on static attributes.** For bound ones, build the string with `$localize` in the component (see `project-card.component.ts`).
- **Translate it**: add the id to `src/locale/messages.de.json` and `messages.th.json`, then run `pnpm --filter @thanikc/ui i18n:check`. Missing/mismatched translations silently fall back to English, so this check is part of green.
- **Translate for meaning**: write what a native speaker would say; don't mirror English clause order, sentence splits or idioms (e.g. "as curious about X as about Y" → no stilted German "wie...wie"). Prefer active voice.
- **Copy edits update all locales in the same change**, never leave one stale.
- **Not translated**: proper nouns/product names (Angular, CrashDash, AI Ling), tech chips, `SocialLink.label` (stable analytics CTA label).
- **No backticks inside comments in inline `styles:`/`template:`** — they close the literal.
- **Verify layout per locale**: German is longer, Thai wraps differently; `e2e/design.e2e.ts` re-runs 360px/1440px checks for `/de/` and `/th/`.
- **Deploy with `build:pages`**, never bare `build` (`scripts/emit-pages-root.mjs` adds root redirect `index.html`/`404.html` and root-only files).

## Privacy Policy

`apps/ui/src/app/domains/privacy/privacy-policy.component.html` is a factual inventory (storage keys like `cookie-consent`, third-party processors, legal bases). Any change adding/removing/repurposing a cookie or storage key, a request to a new third party, or a new data-processing category must update it (plus de/th translations). Pure styling/refactor changes are exempt — but check first.

## Tooling

- **Missing tools**: don't improvise workarounds or trial-and-error scripts; stop and tell the user what to install.
- **Images**: ImageMagick `convert` only. Exception: `convert` drops SVG gradients (renders black), so decode gradient SVGs with `rsvg-convert -w SIZE -h SIZE --background-color=none in.svg -o out.png`, then continue with `convert`. Anything else that doesn't fit: stop and flag it.
- **Tokens**: single-pass diagnostic scripts; never read binary/image assets into context when metrics suffice.
