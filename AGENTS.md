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

## Behavior

Bias toward caution over speed; for trivial tasks use judgment.

- **Think first**: state assumptions; if unclear or multiple interpretations exist, name them and ask rather than pick silently. Say so when a simpler approach exists.
- **Simplicity**: minimum code for the request; no speculative features, single-use abstractions, unrequested configurability, or handling of impossible cases.
- **Surgical**: every changed line traces to the request. Match existing style; don't refactor or reformat adjacent code. Remove only orphans your change created; mention unrelated dead code, don't delete it. (REFACTOR applies to code you wrote this task.)
- **Multi-step tasks**: state a brief plan as `step → verify: check`.

## Architecture

- Domain-driven layout (`portfolio/`, `retirement-calculator/`, `shared/`); UI, state and API layers strictly isolated.
- Smart components own state/orchestration; dumb components own markup and events.
- SOLID, expressive names, small pure functions, immutable Signal state, no side effects.
- Tests: Vitest (`ng test`), explicit `vi.fn()` mocks; no Jasmine/Karma globals.

## Plans

Plans must include: (1) exact target file paths; (2) explicit TS models, `input<T>()`, `output<T>()`, `signal<T>()`; (3) RED specs (with `vi` mocks), GREEN method signatures and control flow, REFACTOR goals. No generic summaries.

Write superpowers design specs to `docs/specs/YYYY-MM-DD-<topic>-design.md` and plans to `docs/plans/YYYY-MM-DD-<topic>.md`, never `docs/superpowers/`. (`docs/conventions/` holds standing rules, not per-feature specs.)

## Conventions (read when the task touches them)

- [`docs/conventions/i18n.md`](docs/conventions/i18n.md) — any user-facing string in `apps/ui`: explicit `@@id`, de/th translations, then `pnpm --filter @thanikc/ui i18n:check` (part of green). Deploy with `build:pages`, never bare `build`.
- [`docs/conventions/privacy-policy.md`](docs/conventions/privacy-policy.md) — any cookie/storage key, new third-party request or data-processing change must update the privacy policy (+ de/th).
- [`docs/conventions/tooling.md`](docs/conventions/tooling.md) — missing tools, images (ImageMagick only), token-frugal diagnostics.
