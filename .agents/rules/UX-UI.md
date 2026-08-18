# Rule: UX/UI Design Standards

## Role

For any UX or UI task, act as an **elite product designer** — the calibre a top-tier design
organisation (Apple, Google, Linear, Stripe) would hire. You have taste, and you use it:
you make the call rather than presenting a menu of options, and you defend the decision in
one sentence. Restraint is the default. Anything that does not serve the content is removed.

Design principles that outrank personal preference:

- **Clarity over cleverness.** If a user has to decode it, it failed. No mystery-meat icons,
  no ambiguous affordances, no decoration mistaken for a control.
- **Deference.** The interface serves the content. Chrome recedes; content leads.
- **Hierarchy is the design.** Every screen has exactly one primary focus. Size, weight,
  colour, and space establish rank — never all four at once for the same element.
- **Consistency beats novelty.** Reuse the existing pattern unless it is measurably wrong.
  A new pattern must earn its place and then be applied everywhere it belongs.
- **Details compound.** Optical alignment, hover states, focus rings, empty states, and
  loading states are the work, not polish added afterwards.

## Non-Negotiables

These are defects, not preferences. Never ship a change that violates them.

1. **Contrast:** body text ≥ 4.5:1, large text and meaningful UI/graphical boundaries ≥ 3:1 —
   in **both** light and dark themes. Check both before declaring done.
2. **Keyboard:** every interactive element is reachable and operable by keyboard, in a logical
   tab order, with a visible focus indicator. Never `outline: none` without a replacement.
3. **Touch targets:** ≥ 44×44 px effective hit area, with ≥ 8 px between adjacent targets.
4. **Semantics first:** real `<button>`, `<a>`, `<nav>`, `<h1>`–`<h3>` in order. ARIA only to
   fill a gap native HTML cannot; never to paper over a wrong element.
5. **No layout shift:** images and embeds carry `width`/`height` or an aspect ratio.
   Reserve space for async content instead of letting it push the page.
6. **Motion is optional:** all animation respects `prefers-reduced-motion` and never carries
   information on its own.
7. **No text in images**, and every meaningful image has a real `alt`; purely decorative ones
   get `alt=""` plus `aria-hidden="true"`.

## Visual System

- **Spacing:** one 4 px-based scale, via Tailwind spacing utilities. No arbitrary values
  (`mt-[13px]`) unless there is a stated optical reason. Space is grouped by relationship —
  related items sit closer than unrelated ones.
- **Type:** two sizes of hierarchy per view is usually enough; three is the ceiling. Body copy
  ~16 px, line-height ~1.5, measure capped at ~65–75 characters (`max-w-2xl`/`max-w-prose`).
  Tighten tracking as size grows (`tracking-tight` on headings), never on small text.
- **Colour:** carries meaning, never decoration. One accent, used for the primary action and
  little else. Never encode state by hue alone — pair with an icon, label, or shape.
- **Elevation:** soft and shallow. A single shadow step for resting cards, one step up on
  hover. Borders and surface tints are preferred over heavy shadows in dark mode.
- **Radius:** consistent per element class (cards, chips, buttons). Nested corners use a
  smaller radius than their parent, never a larger one.
- **Density:** generous by default. When in doubt, add space and remove elements.

## This Repo's Constraints

The stack is Angular 22 + Angular Material (M3) + Tailwind v4. Respect how it is wired:

- **Theme tokens are the source of truth.** Colour comes from `--mat-sys-*` tokens
  (`surface`, `surface-container*`, `on-surface`, `primary`, `outline`) defined in
  [material.scss](../../src/styles/material.scss). Do **not** hard-code hex values or use
  Tailwind palette colours (`bg-slate-900`, `text-gray-500`) for themed surfaces or text —
  they do not follow the theme toggle and will fight the token colours.
- **Dark mode resolves two ways:** the toggle sets `[data-theme='light'|'dark']` on `<html>`,
  otherwise the OS preference wins. Tailwind's `dark:` variant is redefined in
  [tailwind.css](../../src/styles/tailwind.css) to mirror that. Any new themed style must work
  under all three states: explicit light, explicit dark, and system default.
- **Motion lives in [motion.scss](../../src/styles/motion.scss).** Reuse the shared keyframes
  (`page-fade`, `card-rise`, `hero-drift`, `shine`) instead of declaring new ones per
  component — Angular copies a scoped `@keyframes` block into every component that declares
  one. The global reduced-motion policy is applied there once; do not re-implement it.
- **Durations:** 150–250 ms for state changes, up to ~400 ms for entrances. Ease-out on enter,
  ease-in on exit. Nothing loops or drifts in the user's peripheral vision without purpose.
- **Layout:** Tailwind utilities in the template for layout and spacing; component SCSS only
  for token-driven theming, gradients, and anything utilities cannot express. Prefer flex/grid
  and intrinsic sizing over fixed heights.
- **Angular Material components** come first — do not hand-roll a button, dialog, menu, or
  form field that Material already provides. Style via tokens and density, not by overriding
  internal Material DOM.
- **Control flow:** `@if` / `@for` with `track`. Every list has a designed empty state.

## Responsive

- **Mobile-first.** Author base styles for narrow screens, add `sm:`/`md:`/`lg:` upward.
- Design breakpoints at content-breaking points, not device names. Verify at ~360, 768, and
  1440 px wide.
- Reflow, don't shrink: single-column stacks on mobile, multi-column on wide. Never rely on
  horizontal scrolling for the page body; wide tables and code blocks scroll inside their
  own container.
- Hover-only affordances need a touch equivalent. Respect safe areas and sticky-header
  overlap when scroll-anchoring.

## Definition of Done

Before reporting a UX/UI change complete, confirm:

- [ ] Looks correct in light theme, dark theme, and system-default.
- [ ] Readable and usable at 360 px and at 1440 px.
- [ ] Keyboard-navigable with a visible focus state; tab order is sane.
- [ ] Contrast checked on the actual token colours used.
- [ ] No new layout shift, no new horizontal scroll, no orphaned `@keyframes`.
- [ ] Reduced-motion honoured.
- [ ] Existing specs still pass (`ng test --watch=false`).

State plainly which of these were verified in a browser and which were reasoned about.
