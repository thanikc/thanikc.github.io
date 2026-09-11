import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RetirementCalculatorComponent } from './calculator.component';

@Component({
  selector: 'app-calculator-shell',
  imports: [RetirementCalculatorComponent],
  // The host reserves the rendered calculator's height in both defer states, so the
  // footer does not jump when the placeholder is swapped out. Arbitrary values on
  // purpose: they are the heights the Playwright design check measured at each
  // breakpoint's narrowest width (360 → 1388px, 640 → 988px, 768 → 784px,
  // 1024 → 658px), rounded up. Re-measure if the calculator's layout changes.
  host: { class: 'block min-h-[1390px] sm:min-h-[990px] md:min-h-[785px] lg:min-h-[660px]' },
  template: `
    @defer (on immediate) {
      <app-retirement-calculator />
    } @placeholder {
      <section>
        <h1 class="text-2xl font-bold mb-6">Retirement Calculator</h1>
        <p aria-live="polite">Loading…</p>
      </section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalculatorShellComponent {}
