# AI Ling Hardening, Phase 2 Implementation Plan (privacy and compliance)

**Spec:** `docs/specs/2026-11-02-ai-ling-hardening-design.md` §4. Zero spend; absent config = feature off.
Order: Task 1 → 4, each RED → GREEN → REFACTOR, own commit. Worker tests `pnpm --filter @thanikc/worker test`;
UI tests `pnpm --filter @thanikc/ui test`; new UI strings need `@@id` + de/th + `i18n:check`.

## Task 1: pin provider models (2.1)

- Files: `apps/worker/wrangler.jsonc`, `apps/worker/test/models.spec.ts` (new).
- RED: `models.spec.ts` imports `../wrangler.jsonc?raw` (add `*.jsonc?raw` to `test/raw.d.ts`), extracts
  `GROQ_MODEL` / `GOOGLE_MODEL` with a regex, `expect(model).not.toMatch(/latest/)` for each.
- GREEN: `GOOGLE_MODEL` `gemini-flash-latest` → `gemini-2.5-flash`. `GROQ_MODEL` is already pinned.
  `OPENROUTER_MODEL` stays `openrouter/free` (last in chain, watched by the nightly eval).

## Task 2: PII redaction and no-cache (2.2, worker)

- Files: `apps/worker/src/pii.ts` (new), `apps/worker/src/index.ts`, `apps/worker/src/cache.ts`,
  `apps/worker/test/pii.spec.ts` (new), `apps/worker/test/cache.spec.ts`.
- Model: `export function redactPii(text: string): { text: string; found: boolean }`.
  Replacements: email → `[email]`, IBAN or 13–19 digit card-like run → `[number]`, phone (9–15 digits,
  optional `+`, separators ` ()-./`) → `[phone]`. Dates such as `2026-11-02` are left alone.
- RED pii.spec: each pattern redacts and reports `found`; plain text, years and ISO dates untouched.
  cache.spec: a message with an email → provider `fetch` body contains `[email]` and not the address
  (also in `history`), and nothing is stored (second identical request calls the provider again);
  a row older than 7 days is not served.
- GREEN: in the `/api/chat` handler, after validation, redact `message` and each history turn;
  `cacheable = history.length === 0 && !found`; everything downstream (embedding, moderation,
  prompt) uses the redacted text. `TTL_SECONDS` = `7 * 24 * 60 * 60`.
- REFACTOR: none expected beyond naming.

## Task 3: privacy policy (2.1, 2.2; de/th)

- Files: `apps/ui/src/app/domains/privacy/privacy-policy.component.{html,spec.ts}`,
  `apps/ui/src/locale/messages.{de,th}.json`.
- RED: spec asserts `7 days` (not `30 days`), a statement that emails, phone numbers and long digit
  runs are masked before reaching providers, and that Google's free tier may use prompts to improve
  its products and OpenRouter's free models may log them.
- GREEN: edit `privacy.s4.p1`, `privacy.s4.p2`, `privacy.s9.p1`-adjacent paragraph and `privacy.s10.p1`;
  update de/th; `pnpm --filter @thanikc/ui i18n:check`.

## Task 4: transparency notice (2.3)

- Files: `apps/ui/src/app/domains/chat/chat-panel.component.{html,spec.ts}`, locale files.
- RED: `.chat-disclaimer` still closes the transcript, mentions AI, and contains an `<a>` whose href
  ends in `/privacy-policy`.
- GREEN: `@@chat.disclaimer` text → "AI answers can be wrong. Don't share personal data." plus a link
  `@@chat.privacyLink` ("Privacy policy"); de/th; `i18n:check`.

## Review focus

1. Over-redaction (order numbers, years) only weakens a visitor's own question; never blocks it.
2. `gemini-2.5-flash` must be confirmed still served on the free tier before deploy (failover covers it).
