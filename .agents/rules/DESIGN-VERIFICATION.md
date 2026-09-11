# Rule: Verify Design Compliance with Playwright

## When

Any UX or UI change is not done until it has been checked in a real browser against the
[UX-UI.md](UX-UI.md) Non-Negotiables and Definition of Done. Unit specs prove structure
(classes, attributes, order); they cannot prove contrast, overflow, hit areas, focus
visibility, or how a page looks in dark mode. This rule covers what they can't.

Run it after the change is green in `pnpm --filter @thanikc/ui test`, before reporting done.

## Prerequisites

- **Tooling:** `@playwright/test` (runner), `@axe-core/playwright` (contrast and ARIA
  audit), and a Chromium build. If any is missing, **stop** and ask the user to install:

  ```bash
  pnpm --filter @thanikc/ui add -D @playwright/test @axe-core/playwright
  pnpm --filter @thanikc/ui exec playwright install chromium
  ```

  Do not improvise with screenshots from another tool, hand-rolled contrast maths, or
  headless-browser scripts outside Playwright (see "No Workarounds" in AGENTS.md).
- **A browser MCP server** (e.g. Playwright MCP), if available, is fine for exploratory
  checks; the scripted checks below are still the record of what was verified.

## Setup

- **Test the production build, not `ng serve`:** `pnpm --filter @thanikc/ui build`, then
  serve `apps/ui/dist/thanikc/browser` statically. Prerendered HTML, hydration and
  `@defer` blocks only behave as shipped in that build.
- **Stub the chat API** with `page.route('**/api/chat', …)` returning a fixed
  `{ answer, provider, sources }`. Never hit the live worker: it costs provider quota and
  makes results non-deterministic.
- **Settle the page first:** dismiss the cookie-consent banner, wait for the idle-deferred
  chat launcher, and let entrance animations finish (or emulate reduced motion) before
  measuring. The banner and mid-animation cards skew every layout check.
- Spec files live next to the app under `apps/ui/e2e/`; artefacts (screenshots, axe
  reports) go to `tmp/design-check/`, which is git-ignored. Never commit screenshots.

## The Matrix

Every check runs across **3 themes × 3 widths** unless noted:

| Axis   | Values                                                                               |
| ------ | ------------------------------------------------------------------------------------ |
| Theme  | explicit light, explicit dark (`localStorage['theme-mode']` via `addInitScript`), system default (no stored mode, `emulateMedia({ colorScheme })` both ways) |
| Width  | 360, 768, 1440 px                                                                    |
| Motion | `reducedMotion: 'reduce'` for the motion check; default otherwise                    |

Routes in scope: every route touched by the change, plus `/` (it hosts the shared chrome:
header, footer, chat launcher). Open the chat panel for chat changes.

## Checks

Each maps to a UX-UI.md Non-Negotiable. A failure in any cell of the matrix is a failure.

1. **Contrast.** Run axe (`AxeBuilder` with the `color-contrast` rule) in light and dark.
   Zero violations. Axe can't see text over the hero photo or gradients: for those,
   screenshot the element and state that contrast there was judged visually, not measured.
2. **Keyboard.** Tab from the skip link through the whole page. Every interactive element
   is reached in visual order, and each focused element shows a visible indicator (its
   computed `outline` or `box-shadow` differs from the unfocused state). `Escape` closes
   the chat panel and focus returns to whatever opened it.
3. **Touch targets.** Every `a`, `button` and form control has a bounding box of at least
   44×44 px (inline text links inside prose are exempt), with at least 8 px to its nearest
   neighbouring target.
4. **Semantics.** Exactly one `h1` per route; heading levels never skip; landmarks
   (`header`, `nav`, `main`, `footer`) present. Run axe with its default ruleset and allow
   zero serious or critical violations.
5. **Layout shift.** Record cumulative layout shift with a `PerformanceObserver` for
   `layout-shift` from navigation until idle. CLS must stay below 0.1; report the value.
6. **Motion.** With reduced motion emulated, no element is still animating after load
   (`document.getAnimations()` is empty or finished).
7. **Images.** Every `img` has an `alt` attribute; decorative ones have `alt=""` and
   `aria-hidden="true"`; every image has `width` and `height` or an aspect ratio.
8. **Responsive.** At every width, `document.documentElement.scrollWidth` is no greater
   than `clientWidth` (no horizontal page scroll), and no text is clipped
   (`scrollWidth > clientWidth` on a text container with `overflow: hidden` is a failure).
9. **Theme tokens.** In dark mode, no text or surface renders in a colour that stays
   identical to light mode when it should follow the theme — compare computed `color` and
   `background-color` of the checked elements across the two themes.

## Visual Review

Take one full-page screenshot per theme × width into `tmp/design-check/`. Only read a
screenshot into the conversation when a check needs visual judgement (text over images,
alignment, hierarchy) or a check has failed; metrics and axe reports come first
(Token Economy, AGENTS.md).

## Reporting

Report a compact table: check × matrix cell → pass / fail, with the measured value where
there is one (CLS, smallest target, axe violation count). Then state plainly:

- which checks ran in a browser and which were reasoned about only;
- anything skipped and why (e.g. "contrast over the hero photo judged visually").

Never report a UI change as verified if these checks were not run.
