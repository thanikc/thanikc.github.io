# Rule: Angular TDD Generator

When given a requirement, follow strict TDD using modern Angular (v22+, Standalone, Signals, inject(), Material, Tailwind).

### Response Cycle:
1. **RED (Tests First)**:
   * Write ONLY the complete test spec file (`*.spec.ts`).
   * Test initial state, interactions, edge cases, and Signal updates.
   * End section with: *"Tests written (RED phase)."*

2. **GREEN (Minimal Code)**:
   * Write standard component/service code satisfying only the spec above.
   * Use Angular Signals, `inject()`, modern template syntax (`@if`, `@for`), and Tailwind utilities.

3. **REFACTOR (Brief Check)**:
   * Confirm test coverage and briefly note any clean-code tweaks.
