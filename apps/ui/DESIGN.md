---
name: thanikc
description: Portfolio, resume chatbot and retirement calculator of a full-stack engineer; light stone pages broken by charcoal bands, with gold for the one thing to act on.
colors:
  primary: "#40655d"
  primary-seed: "#0d352e"
  primary-container: "#c2ebe0"
  on-primary-container: "#284d46"
  tertiary: "#795900"
  tertiary-container: "#ffdf9f"
  on-tertiary-container: "#5c4300"
  secondary-container: "#c2edcb"
  on-secondary-container: "#294e36"
  surface-base: "#f4f4f2"
  surface-raised: "#dad6ce"
  on-surface: "#1a1c1b"
  on-surface-variant: "#414846"
  outline: "#717976"
  outline-variant: "#c0c8c5"
  inverse-surface: "#2f3130"
  inverse-on-surface: "#f1f1ef"
  on-inverse-muted: "#bbbbba"
  warning-container: "#fef3c7"
  on-warning-container: "#7a350c"
  success-container: "#d1fae5"
  on-success-container: "#04543c"
typography:
  display:
    fontFamily: "Manrope, Noto Sans Thai, Manrope Fallback, Arial, sans-serif"
    fontSize: "3rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Manrope, Noto Sans Thai, Manrope Fallback, Arial, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  answer:
    fontFamily: "Manrope, Noto Sans Thai, Manrope Fallback, Arial, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.375
    letterSpacing: "-0.01em"
    fontFeature: "\"tnum\" on"
  title:
    fontFamily: "Manrope, Noto Sans Thai, Manrope Fallback, Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: "Manrope, Noto Sans Thai, Manrope Fallback, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.625
  label-mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.33
    letterSpacing: "0.1em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  gutter: "16px"
  column: "72rem"
components:
  button-cta-gold:
    backgroundColor: "{colors.tertiary-container}"
    textColor: "{colors.on-tertiary-container}"
    rounded: "{rounded.full}"
    height: "44px"
  button-outlined-on-light:
    textColor: "{colors.on-primary-container}"
    rounded: "{rounded.full}"
    height: "44px"
  button-outlined-on-band:
    textColor: "{colors.inverse-on-surface}"
    rounded: "{rounded.full}"
    height: "44px"
  button-text-on-light:
    textColor: "{colors.on-primary-container}"
    rounded: "{rounded.full}"
    height: "44px"
  card-raised:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    padding: "24px"
  band-charcoal:
    backgroundColor: "{colors.inverse-surface}"
    textColor: "{colors.inverse-on-surface}"
  calculator-stage:
    backgroundColor: "{colors.inverse-surface}"
    textColor: "{colors.inverse-on-surface}"
    rounded: "{rounded.lg}"
    padding: "32px"
  calculator-deck:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: "24px"
  chip-stack:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.on-secondary-container}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  chat-launcher:
    rounded: "{rounded.full}"
    size: "64px"
---

# Design System: thanikc

## Overview

**Creative North Star: "The Workshop Ledger"**

A light, stone-toned page that reads like an engineer's ledger: quiet type, thin rules, and a few dark charcoal bands where the work is shown rather than described (the hero, the work themes, the calculator's chart stage, the footer). The page alternates light and dark on purpose; nothing is uniformly dark and nothing is decorated for its own sake. Depth comes from tone and a single hairline, not from shadow.

Gold is the signal. On charcoal it marks the one action or figure that matters (the email CTA, the calculator's answer, its goal line); on the light page the darker tertiary is the accent tone. Deep pine green (the primary seed) stays in the background: link and button labels, the project mark's accent cell, the chat badge. Type is one family, Manrope, at a light regular weight for display sizes with tight tracking, and a monospace face only for small data labels and chart axis ticks.

The system is built on Angular Material M3 tokens and retinted through Material's own theming variables, never through component internals. Contrast floors are enforced by e2e checks, so values here are legibility-driven, not taste-driven.

**Key Characteristics:**
- Light stone base, charcoal full-bleed bands as narrative breaks.
- Gold (tertiary) for the one thing to act on or read first.
- Flat at rest: tonal fills plus a 1px outline; shadows only on floating layers.
- One sans family (Manrope) with metric-matched fallback; mono only for data labels.
- Three locales from one layout: German hyphenates, Thai has its own face, headings balance.
- Motion is short and settling; reduced motion swaps travel for fades rather than killing state changes.

## Colors

A muted pine-and-stone palette with a single warm gold accent, generated from M3 seeds (primary #0d352e, secondary #547b5f, tertiary #efb300).

### Primary
- **Pine Ledger Green** (primary): button and link labels on light fills, the accent cell of each project mark, the chat launcher's AI badge, focused field outlines.
- **Deep Pine** (on-primary-container): the retinted label colour for every outlined and text button and for focused form-field labels on light fills; chosen because primary measured 4.47:1 on the stone card, just under 4.5:1.
- **Pine Mist** (primary-container): icon tiles at the top of cards.

### Secondary
- **Sage Wash** (secondary-container / on-secondary-container): tech-stack chips on project cards.

### Tertiary
- **Harvest Gold** (tertiary-container): the filled CTA on charcoal bands, the calculator's answer figures, its with-saving curve, dashed goal line and goal label, and the 14% gap wash under the curve.
- **Ochre** (tertiary): the accent tone directly on the light page (the heading rule motif, the calculator's input keys); the light gold would be too close in lightness to the base to read.

### Neutral
- **Stone Page** (surface-base): the page itself; neutral-96, reused from M3 surface-container-low.
- **Raised Stone** (surface-raised): the only hand-picked neutral; cards, the calculator input deck, the chat panel.
- **Ink** (on-surface) and **Slate Ink** (on-surface-variant): primary and secondary text on light fills.
- **Charcoal** (inverse-surface) with **Chalk** (inverse-on-surface): every dark band. **Muted Chalk** (on-inverse-muted, chalk at 72% over charcoal) carries secondary text, the no-saving curve and axis ticks on bands.
- **Outline** (outline): the 1px card boundary (3:1 against the page). **Hairline** (outline-variant): dividers and pill borders.
- **Caution** (warning-container pair) and **Success** (success-container pair): status tones; the calculator's optimistic-return hint uses the warning text tone.

### Named Rules
**The Gold Means Act Rule.** On a charcoal band, gold marks the one CTA or the one figure the band is about. A band with two gold actions has none.

**The Band Retint Rule.** Root button retints are calibrated for light fills. Anything on a charcoal band retints locally to inverse-on-surface (or tertiary-container for the filled CTA), never reusing the root tokens.

**The Separation Floor Rule.** A raised card must stand apart from the page by fill (contrast at least 1.3) and by border (3:1). Fills alone are not a boundary.

## Typography

**Display Font:** Manrope (with Noto Sans Thai for Thai glyphs, then the metric-matched "Manrope Fallback" over Arial)
**Body Font:** Manrope (same stack, via Material's body-medium)
**Label/Mono Font:** the platform monospace stack (ui-monospace, SFMono-Regular, Menlo, Consolas)

**Character:** A single geometric-humanist sans used light and large for statements, bold and small for names, with a monospace whisper for data. Restrained, legible, never shouty.

### Hierarchy
- **Display** (400, 3rem rising to 4.5rem from 640px, tight tracking): the hero name only.
- **Headline** (400, 1.875rem rising to 2.25rem, tight tracking): section titles.
- **Answer** (400, 1.5rem rising to 2.25rem, snug leading, tabular figures): the calculator's one-sentence answer; figures inside it go 600 and gold.
- **Title** (700, 1.125rem): project names, page titles (1.5rem bold on utility pages such as the calculator).
- **Body** (400, 0.875rem, relaxed 1.625 leading): card copy and section prose; hero lead runs 1.125rem medium. Prose caps at roughly 60-65ch (max-w-prose, 60ch, 42rem method panel).
- **Label Mono** (400, 0.75rem, 0.1em tracking): toolbox group labels, interest indexes, the privacy revision date, chart axis ticks.

### Named Rules
**The Balanced Heading Rule.** Every h1-h3 uses balanced wrapping; no one-word last lines.

**The German Hyphen Rule.** Only German hyphenates automatically, and only words of 10+ letters with at least 4 letters either side. English never hyphenates; a hard break is the last resort for unbreakable strings (URLs, long Thai runs).

**The Tabular Figures Rule.** Any number that changes while the user watches (the answer, end labels, typed inputs) uses tabular figures.

## Layout

One centred content column (72rem max, 16px gutter) on the light page. Charcoal bands break out full-bleed with viewport maths (100vw with calc(50% - 50vw) margins) and re-centre their own content to the same column; the html element clips horizontal overflow so sticky positioning survives. Sections stack with generous vertical padding (56-80px; the hero 80-112px and at least 80svh). Spacing rhythm is 4px-based, mostly 8 / 12 / 16 / 24px gaps; cards pad 24px. Breakpoints follow Tailwind: 640px (sm) is the main step where type scales up and the launcher grows, 768px (md) moves the calculator deck to three columns, 1024px (lg) lets the English answer sentence fit one line. The header is sticky in flow, transparent over the page until scrolled, then a 96% opaque surface-container fill with a hairline bottom (no backdrop blur). Floating controls stack in the bottom-right: chat launcher at 1rem inset, scroll-to-top centred above it, both anchored sticky above the footer.

Reserve space for content that changes: the calculator answer holds its longest wrap per locale (min-height in lh units) so font swap or new figures never move the chart.

## Elevation & Depth

Flat by default. Depth is conveyed by tone: stone page, raised stone card, charcoal band, plus a 1px outline where a card meets the page. Soft ambient radial washes (primary and tertiary at 8%) tint the page shell, and an 18% tertiary radial glows from a corner of each charcoal scene poster. Material elevation shadows appear only on layers that float over content: the chat sheet (level 3), the launcher tip (level 2), the launcher's AI badge (level 1).

### Shadow Vocabulary
- **Floating sheet** (`var(--mat-sys-level3)`): the chat panel over the page.
- **Bubble** (`var(--mat-sys-level2)`): the launcher hint.
- **Badge lift** (`var(--mat-sys-level1)`): the small AI badge on the launcher.

### Named Rules
**The Flat-In-Flow Rule.** Nothing in the document flow casts a shadow. Only overlays and floating controls lift.

## Shapes

Mixed by role. Profile project cards are square-cornered and borderless (the fill is the boundary inside the grid). The calculator's stage and deck, chat sheet and chat bubbles use a 16px radius. Pills (Material buttons, status tags, stack chips, progress dots) are fully rounded; the chat launcher is forced from Material's rounded square back to a true circle. Inner flow-step tiles use 8px with a hairline border. Lines are thin and flat: 1px rules, 1.5px chart keys, a 3px gradient rule under ordinary h2s (ochre to transparent, 48px wide), removed for section openers.

## Components

### Buttons
Material M3 buttons, retinted through Material's tokens; tactile but quiet.
- **Shape:** full pill, 44px minimum height on every action.
- **Primary (gold CTA):** filled, Harvest Gold fill with dark gold label; used for the email / "Start a conversation" action on charcoal bands.
- **Outlined / Text on light:** Deep Pine label; project links and Ask AI Ling hooks.
- **Outlined / Text on band:** Chalk label and outline, set locally per band.
- **Text toggles:** project "Details" and the calculator's "How this is calculated" are underlined text controls (1px, 0.25em offset); the method disclosure draws its own CSS chevron that rotates 150ms on open.

### Chips
- **Stack chips:** Sage Wash pill, 12px x 4px, 0.75rem semibold.
- **Status tag:** hairline-bordered pill, muted text, 0.75rem semibold, uppercase, wide tracking.

### Cards / Containers
- **Corner Style:** square on profile project tiles; 16px on calculator and chat containers.
- **Background:** Raised Stone.
- **Shadow Strategy:** none (see Elevation).
- **Border:** 1px Outline by default; project tiles drop it inside their grid.
- **Internal Padding:** 24px (16px on phones for the calculator deck).
- **Entrance:** rise 14px and fade over 0.5s, staggered by inline delay.

### Inputs / Fields
- **Style:** Material outlined form fields on the stone deck.
- **Focus:** Material outline in primary; the floating label retinted to Deep Pine for 4.5:1 on stone.
- **Keys:** each calculator input carries a small CSS-drawn key of the chart part it moves (muted line, gold dash, axis corner).

### Navigation
Sticky header: wordmark left, Work / Projects / Contact text buttons and the language picker right. Transparent until scrolled, then near-opaque surface fill with a hairline. On phones the links tighten their side padding and some hide.

### Charcoal Band
The signature break: full-bleed Charcoal with Chalk text and Muted Chalk secondary text, a deferred animated scene behind a static gradient poster of identical size. Used for the hero, the pinned work-theme panels and the footer (which closes on a large wordmark).

### Project Card
Pixel-mosaic mark and status tag, name, tagline, then a "Decision:" line on the face; why / flow / stack sit behind a Details disclosure that opens with a 0fr-to-1fr grid-row transition (250ms). One primary link style per card plus the Ask AI Ling hook, all pinned to the bottom so rows align.

### Ask AI Ling Hook
A text (or outlined) button with a sparkle icon that opens the chat pre-filled with a question; appears on project cards, the hero invite, and the toolbox.

### Chat Launcher and Tip
A 64px (96px from 640px) circular portrait button with a 1px outline and a primary-filled AI badge ringed in the page colour. A light tip bubble (surface-container-highest, outline, level-2 lift) sits to its left on hover or focus and peeks once on arrival from 640px.

### Trajectory Chart (calculator)
On a 16px-radius Charcoal stage: the answer sentence at display size, then a hand-built SVG. The with-saving curve is 3px Harvest Gold over a 14% gold gap wash, the goal is a 1px 6/6 dashed gold line, the no-saving path a 1.5px Muted Chalk line; end labels are 0.875rem semibold tabular in each path's colour; axis ticks are mono above a 30% chalk rule. Strokes do not scale with the viewBox. The curve redraws in 450ms on input change; invalid input dims the last valid chart to 30% rather than emptying it. Surface brief: `.impeccable/surfaces/ment-calculator-calculator-component-html-0ab35b81.md`.

### Motion
Page enters with a 6px rise and fade (0.35s); hovers nudge 1-3px over 0.2-0.25s; the settling curve cubic-bezier(0.22, 1, 0.36, 1) drives the chart and disclosures. Under reduced motion, travel keyframes are redefined as plain fades and opacity/colour transitions keep their timing.

## Do's and Don'ts

### Do:
- **Do** put gold (tertiary-container) on charcoal for the single action or figure the band exists for.
- **Do** retint Material buttons through `--mat-button-*` tokens, locally on dark bands.
- **Do** keep raised cards at least 1.3 fill contrast and a 3:1 border against the page.
- **Do** use tabular figures for live numbers and reserve their line height per locale.
- **Do** give every action a 44px target.
- **Do** keep a static, same-size poster under any deferred scene so nothing shifts.
- **Do** provide a reduced-motion alternative that fades instead of travelling.

### Don't:
- **Don't** put shadows on in-flow content; lift is for overlays and floating controls.
- **Don't** reuse the root button retints on a charcoal band.
- **Don't** use primary for text labels on Raised Stone; it misses 4.5:1 there (use on-primary-container).
- **Don't** hyphenate English, or hyphenate German below 10 letters.
- **Don't** add a backdrop blur over the animated scenes.
