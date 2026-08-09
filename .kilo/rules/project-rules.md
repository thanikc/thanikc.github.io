# Rule: Angular TDD & Interaction Workflow

When implementing features, follow strict TDD using modern Angular (v22+, Standalone, Signals, `inject()`, Material, Tailwind).

> ⚠️ **CRITICAL EXECUTION GUARDRAIL**: Never execute test scripts or terminal commands (`ng test`) automatically. Always stop, ask the user to run tests, and await feedback.

## ⚡ Output Constraints (Token Efficiency)

- **Be Concise**: Skip long preamble, extensive logs, or wordy explanations.
- **Code First**: Output required files directly with only a 1–2 sentence summary per step.

## 🏗️ Architecture Context

- **Isolation**: Domain-driven layout (`portfolio/`, `retirement-calculator/`, `shared/`).
- **Testing Stack**: Vitest runner (`ng test`). Mock domain data (e.g., World Bank API) cleanly in spec files.

---

## 🔄 TDD Workflow

### 1. 🔴 RED Phase

- Write **ONLY** the spec file (`*.spec.ts`).
- End response strictly with:
  > **RED Phase complete.** Please run `ng test` and reply with the test output.

### 2. 🟢 GREEN Phase

- Write the minimal code (`*.ts`, `*.html`) using Signals, `inject()`, control flow (`@if`, `@for`), Material, and Tailwind.
- End response strictly with:
  > **GREEN Phase complete.** Please re-run `ng test` and provide the updated results.

### 3. 🔵 REFACTOR Phase

- Apply clean-code or Signal optimizations if needed.
- Provide a 1-sentence summary of refactoring tweaks made.
