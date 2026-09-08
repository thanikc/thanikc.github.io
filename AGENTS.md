# Rule: Angular TDD & Clean Code Workflow

## Monorepo layout

pnpm workspace (`pnpm-workspace.yaml` → `apps/*`). Root holds only shared dev
tooling (prettier, husky, lint-staged).

- `apps/ui` — the Angular site (`@thanikc/ui`). All rules in this doc apply here.
  Run commands with `pnpm --filter @thanikc/ui <script>` (e.g. `… test`, `… build`,
  `… start`).
- `apps/worker` — Cloudflare Worker API (`@thanikc/worker`) for the resume chatbot
  (Hono + Vectorize RAG + Groq/Google/OpenRouter). TDD still applies: write
  `test/*.spec.ts` first with `vitest` under `@cloudflare/vitest-plugin`, stub the
  `AI` / `VECTORIZE` bindings and global `fetch` per-test, and drive endpoints via
  `app.request(url, init, env)`. Run `pnpm --filter @thanikc/worker test`.
  See `apps/worker/README.md`.

Follow strict TDD with modern Angular (v22+, Standalone, Signals, inject(), Material, Tailwind).
Run the tests yourself (`pnpm --filter @thanikc/ui test`) at every RED and GREEN step — do not stop to ask. Report failures with the actual output.

## Output Constraints

- Be concise: Avoid preambles, logs, or wordy explanations.
- Code first: Output required files directly with a 1–2 sentence summary per step.

## Architecture & Clean Code Standards

- Separation of Concerns: Domain-driven layout (`portfolio/`, `retirement-calculator/`, `shared/`). Keep UI, state, and API layers strictly isolated.
- Smart vs. Dumb Components: Smart components manage state and orchestration; dumb components handle presentational markup and events.
- Clean Code & SOLID: Focus on single responsibility, expressive naming, small pure functions, and immutable Signal state. Avoid side effects.
- Testing Stack: Vitest runner (`ng test`). Mock domain data cleanly in spec files using explicit `vi.fn()` imports. Avoid Jasmine/Karma globals (`jasmine.createSpyObj`).

## Plan Mode Directives (For Planning Agent)

When generating plans, avoid generic summaries. Outputs **must** strictly include:

1. **Target Files**: Exact relative file paths to be created or modified.
2. **Interface & Signal Definitions**: Explicit TypeScript models, signal inputs (`input<T>()`), signal outputs (`output<T>()`), and state signals (`signal<T>()`).
3. **Phase Breakdown**:
   - **RED Step**: Exact test specs to write in `*.spec.ts` (including Vitest `vi` mocks).
   - **GREEN Step**: Specific component/service method signatures and template control flow (`@if`, `@for`).
   - **REFACTOR Step**: Explicit Signal optimization or DRY goals.

## TDD Workflow

1. **RED Phase**: Write ONLY the spec file (`*.spec.ts`). Run `pnpm --filter @thanikc/ui test` (or `@thanikc/worker`) and confirm it fails for the expected reason.
2. **GREEN Phase**: Write minimal implementation code (`*.ts`, `*.html`) using Signals, `inject()`, control flow (`@if`, `@for`), Material, Tailwind. Run the same command until green.
3. **REFACTOR Phase**: Apply clean-code, DRY, or Signal optimizations without breaking behavior. Summarize in 1 sentence.

## Missing Tooling & Efficiency Rule

- **No Workarounds for Missing Tools:** If optimal tooling (e.g., standard image encoders, libraries) is missing, do not improvise multi-step workarounds, iterative trial-and-error scripts, or pull heavy files into context. Stop immediately and instruct the user to install the required dependency or tool.
- **Token Economy:** Keep diagnostic scripts single-pass. Never read binary/image assets into conversation context when metrics or logs suffice.

## Available Skills & Capabilities

You have access to specialized skills located in the `.agents/skills/` directory.
Before executing a complex task, review the corresponding skill folder to understand the required workflow, standards, and outputs.

### Code & Development

- **Angular:** Refer to `.agents/skills/angular-developer/SKILL.md` for specific component, signal, and dependency injection patterns.

### Design & UX/UI

- **UX/UI:** For any UX or UI task (layout, styling, theming, responsiveness, accessibility, interaction, or visual design), read `.agents/rules/UX-UI.md` first and follow its rules.
