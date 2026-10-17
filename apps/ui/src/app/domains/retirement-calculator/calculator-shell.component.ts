import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RetirementCalculatorComponent } from './calculator.component';

@Component({
  selector: 'app-calculator-shell',
  imports: [RetirementCalculatorComponent],
  // The host reserves the rendered calculator's height in both defer states, so the
  // footer does not jump when the placeholder is swapped out. Arbitrary values on
  // purpose: the tallest of en/de/th at each breakpoint's narrowest width, measured
  // with the baseline assumptions (whose source note is the longer one): 360 → 1642px
  // (de), 640 → 1186px (de), 768 → 954px (de), 1024 → 760px (en/de), rounded up.
  // Re-measure if the calculator's layout or copy changes.
  host: { class: 'block mb-8 min-h-[1650px] sm:min-h-[1190px] md:min-h-[960px] lg:min-h-[760px]' },
  template: `
    @defer (on immediate) {
      <app-retirement-calculator />
    } @placeholder {
      <section>
        <h1
          class="page-heading text-2xl font-bold mb-6"
          i18n="Heading of the calculator page@@calculator.pageTitle"
        >
          Retirement Calculator
        </h1>
        <p aria-live="polite" i18n="Shown until the calculator has loaded@@calculator.loading">
          Loading…
        </p>
      </section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalculatorShellComponent {}
