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
   against **every fixed background the element can actually sit on**. This app has no theme
   toggle, but a page can still mix a dark full-bleed section (e.g. a hero or narrative section
   on `inverse-surface`) with light content sections — check contrast on each background
   separately, not just once.
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
  they won't move if the palette changes and will fight the token colours.
- **The app is light-only — there is no theme toggle** (removed in the to-top.ch re-theme; see
  [DESIGN-VERIFICATION.md](DESIGN-VERIFICATION.md)). Don't reintroduce `[data-theme]`/`dark:`
  branching. A fixed dark *section* (hero, full-bleed narrative block, footer) is still allowed
  as a structural design choice — build it from `--mat-sys-inverse-surface` /
  `inverse-on-surface` (or another real token), not a hand-picked hex, so it stays theme-aware
  if the palette ever changes. It's a section-level background, not a mode the user can toggle.
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

## Scroll-Driven & Canvas Sections

A pinned section whose visual (illustration, particle field, 3D scene) advances with scroll
progress is allowed as a storytelling device — it earns its place the same way any pattern
does: it must serve the content it sits next to, not run everywhere on principle. Build it as:

- **Sticky, not hijacked.** Pin with CSS `position: sticky` over an intrinsically taller
  wrapper; map scroll position within that wrapper to a progress value. Never call
  `preventDefault` on `wheel`/`touch`/`scroll`, never override scroll speed or snap the
  viewport programmatically. Keyboard scrolling (`PageDown`, `Space`, arrows), trackpad, and
  screen-reader virtual cursor navigation must all move through the page exactly as they would
  without the effect.
- **Decorative only.** The canvas/illustration never carries information the surrounding real
  DOM doesn't also state — a screen-reader user or a `prefers-reduced-motion` user gets the
  full content with a static (or absent) visual, never a degraded message.
- **`prefers-reduced-motion` gets a static frame**, not a slower version of the same animation:
  no scroll-linked transform, no render loop running at all.
- **Pause what's off-screen.** Gate any render loop on `IntersectionObserver`; stop it the
  moment the section leaves the viewport, and dispose the context/resources on component
  destroy — don't let inactive scenes keep costing a frame budget or a WebGL context slot.
- **Keep it out of the critical path.** Defer-load the engine and the scene behind
  `@defer (on viewport)`; a prerendered/SSR response should ship a static placeholder (poster
  image or gradient, sized to avoid layout shift), never the canvas element itself pre-hydrated
  with fallback content in its place.
- **Budget it.** A visual dependency (e.g. a WebGL library) is justified when the effect
  genuinely needs it — check the production bundle-size budget after adding one, and give
  lower-end devices a cheaper variant (fewer particles, no shadows) rather than skipping the
  effect for them entirely or blocking the thread until it's ready.

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

- [ ] Looks correct against every fixed background it appears on (light content sections and
      any dark full-bleed section).
- [ ] Readable and usable at 360 px and at 1440 px.
- [ ] Keyboard-navigable with a visible focus state; tab order is sane.
- [ ] Contrast checked on the actual token colours used, per background.
- [ ] No new layout shift, no new horizontal scroll, no orphaned `@keyframes`.
- [ ] Reduced-motion honoured — including a static fallback for any scroll-driven/canvas scene.
- [ ] Any scroll-pinned section: keyboard and trackpad scroll behave normally, no
      `preventDefault` on scroll input; no canvas/3D dependency shipped in prerendered HTML.
- [ ] Existing specs still pass (`ng test --watch=false`).

Verify these in a browser with Playwright as described in
[DESIGN-VERIFICATION.md](DESIGN-VERIFICATION.md). State plainly which of these were verified
in a browser and which were reasoned about.
