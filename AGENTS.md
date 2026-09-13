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

## Internationalization (apps/ui)

The site is built three times — English (source), German, Thai — and served from
`/en/`, `/de/` and `/th/` (the `i18n` block in `angular.json`). Consequences that
change how you work:

- **Every user-facing string is translated.** Mark it up as you add it:
  `i18n="what this is@@area.key"` on a template element, `i18n-aria-label=` (and the
  same for any other attribute), or `` $localize`:what this is@@area.key:text` `` in
  TypeScript. Always give an explicit `@@id` — Angular derives ids from the text
  otherwise, and every copy edit then silently drops the translations.
- **Then translate it.** Add the id to `src/locale/messages.de.json` and
  `messages.th.json` and run `pnpm --filter @thanikc/ui i18n:check` (extracts, then
  verifies every message is translated and its placeholders match). A message with a
  missing or mismatched translation falls back to English in a build that otherwise
  looks fine, so treat that check as part of green.
- **Editing existing copy updates every locale, in the same change.** If you change
  the English text (or any locale's text) for an id that already has translations,
  update `messages.de.json` and `messages.th.json` for that id too — never leave one
  language stale while the others move on.
- **Keep out of i18n:** proper nouns and product names (Angular, CrashDash, AI Ling),
  technology chips, and `SocialLink.label` — that one doubles as the analytics CTA
  label and must stay stable across locales.
- **`i18n-` only marks up static attributes.** For a bound one, build the string in
  the component with `$localize` and bind that (see `project-card.component.ts`).
- **Backticks are forbidden inside an inline `styles:` or `template:` comment** —
  they close the template literal. Use quotes.
- **Layout is verified per language, not just in English.** German words are longer
  than their English source and Thai wraps differently; `e2e/design.e2e.ts` re-runs
  the 360px and 1440px checks for `/de/` and `/th/` for exactly that reason.
- **Deploy with `build:pages`**, never bare `build`: the localized build writes
  nothing to the deployment root, and `scripts/emit-pages-root.mjs` adds the language
  redirect (`index.html`, `404.html`) plus the root-only files.
- `ng serve` and `ng test` run the English build only (`localize: ["en"]`).

## Privacy Policy

`apps/ui/src/app/domains/privacy/privacy-policy.component.html` is a factual
inventory of what the site stores and sends, not boilerplate — it names specific
storage keys (e.g. `cookie-consent`), third-party processors, and legal bases.
Any change that adds, removes, or repurposes a cookie/local-storage key, an
outgoing request to a new third party, or a new category of data processing
**must** be checked against this file, and updated (with matching entries in
`messages.de.json` and `messages.th.json`, per the i18n rules above) if it's now
out of date. Pure styling/markup/refactor changes with no new data flow don't need
an update — but check before assuming that's the case.

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
- **Image Manipulation:** Use ImageMagick (`convert`) for all image manipulation (resize, crop, format conversion, compositing, etc.). Do not reach for alternative tools as a workaround.
  - **SVG decode exception:** `convert` here always uses its internal MSVG renderer for `.svg` (even with `rsvg-convert` installed) and silently drops gradients (renders solid black). For any gradient SVG, decode with `rsvg-convert -w SIZE -h SIZE --background-color=none source.svg -o out.png`, then do everything else (resize, flatten, composite) with `convert` as normal.
  - If a case doesn't fit that, stop and flag it to the user rather than swapping tools further.
- **Token Economy:** Keep diagnostic scripts single-pass. Never read binary/image assets into conversation context when metrics or logs suffice.

## Available Skills & Capabilities

You have access to specialized skills located in the `.agents/skills/` directory.
Before executing a complex task, review the corresponding skill folder to understand the required workflow, standards, and outputs.

### Code & Development

- **Angular:** Refer to `.agents/skills/angular-developer/SKILL.md` for specific component, signal, and dependency injection patterns.

### Design & UX/UI

- **UX/UI:** For any UX or UI task (layout, styling, theming, responsiveness, accessibility, interaction, or visual design), read `.agents/rules/UX-UI.md` first and follow its rules.
- **Design verification:** Before reporting a UI change done, verify it in a browser with Playwright per `.agents/rules/DESIGN-VERIFICATION.md` (themes × widths matrix, axe contrast, keyboard, hit areas, layout shift, overflow).
