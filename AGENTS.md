# Rule: Angular TDD & Clean Code Workflow

Follow strict TDD with modern Angular (v22+, Standalone, Signals, inject(), Material, Tailwind).
CRITICAL GUARDRAIL: Never execute test commands (`ng test`) automatically. Always stop and prompt user to run tests.

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

1. **RED Phase**: Write ONLY the spec file (`*.spec.ts`). Prompt user to run tests (`ng test`).
2. **GREEN Phase**: Write minimal implementation code (`*.ts`, `*.html`) using Signals, `inject()`, control flow (`@if`, `@for`), Material, Tailwind. Prompt user to run tests.
3. **REFACTOR Phase**: Apply clean-code, DRY, or Signal optimizations without breaking behavior. Summarize in 1 sentence.

## Available Skills & Capabilities

You have access to specialized skills located in the `.agents/skills/` directory.
Before executing a complex task, review the corresponding skill folder to understand the required workflow, standards, and outputs.

### Code & Development

- **Angular:** Refer to `.agents/skills/angular-developer/SKILL.md` for specific component, signal, and dependency injection patterns.
