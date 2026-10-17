---
version: 1
slug: "ment-calculator-calculator-component-html-0ab35b81"
primary_target: "src/app/domains/retirement-calculator/calculator.component.html"
related_targets: ["src/app/domains/retirement-calculator/assumptions-info-card.component.html"]
---

# Surface: retirement calculator (/calculator)

Mode: Operate (a real planning tool), built as the site's showpiece of craft.
Audience: visitors planning their own retirement; hiring tech leads judging "the site is the evidence".
Job: enter where you are and what you want; understand the monthly saving needed and why; trust the assumptions.
Constraints: real (after-inflation) return from World Bank data, local currency per locale (USD/EUR/THB), input bounds, polite live announcement, three locales, prerendered shell with @defer, no new dependencies (chart is hand-built SVG).

## Direction contract
THESIS: The answer is a picture of your money over time, not four number tiles. Refuses the stock form-then-result-cards arrangement.
OWN-WORLD: The profile's charcoal band (inverse-surface) carrying the chart, gold (tertiary) for the target line and the answer, stone (raised beige) for the input deck, Manrope display numerals with tabular figures, mono only for axis ticks. Thin 1px rules, no shadows, no gradient tiles.
STORY: The visitor reads one sentence that answers them, sees the curve rise to meet the gold target line, moves an input and watches the curve and the gap respond, then opens "How this is calculated" if they want the maths.
FIRST VIEWPORT: Title and one purpose line; the answer sentence at display size ("Save $1,338 a month for 30 years to retire on $4,000 a month"); the full-width charcoal trajectory chart (today → retirement year, target line, shaded gap, end labels); the input deck directly under it, each input labelled with the part of the curve it moves.
FORM: Trajectory chart, #3 of 7 on my ordered list (dealt lead). seed:fe32b2f92cdb00e7
SIGNATURE: the curve and gap re-draw continuously as inputs change (transition on the path, reduced-motion: instant).
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
