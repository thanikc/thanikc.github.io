import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RetirementCalculatorComponent } from './calculator.component';

@Component({
  selector: 'app-calculator-shell',
  imports: [RetirementCalculatorComponent],
  // The host reserves the rendered calculator's height in both defer states, so the
  // footer does not jump when the placeholder is swapped out. Arbitrary values on
  // purpose: the tallest of en/de/th anywhere in each breakpoint band, measured with
  // the Playwright design check's stubs (639 → 1326px, 767 → 1280px, 1023 → 1066px,
  // 1440 → 1102px), rounded up. The chart scales with width, so the narrow end of a
  // band keeps up to ~110px spare. Re-measure if the calculator's layout or copy changes.
  host: {
    class: 'block mb-8 min-h-[1330px] sm:min-h-[1285px] md:min-h-[1070px] lg:min-h-[1105px]',
  },
  template: `
    @defer (on immediate) {
      <app-retirement-calculator />
    } @placeholder {
      <section>
        <h1
          class="page-heading text-2xl font-bold mb-6"
          i18n="Heading of the calculator page@@calculator.pageTitle"
        >
          Retirement calculator
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
