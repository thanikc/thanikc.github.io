import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RetirementCalculatorComponent } from './calculator.component';

@Component({
  selector: 'app-calculator-shell',
  imports: [RetirementCalculatorComponent],
  template: `
    @defer (on immediate) {
      <app-retirement-calculator />
    } @placeholder {
      <section class="calculator-container p-6 rounded-2xl">
        <h2 class="text-2xl font-bold mb-6">Retirement Calculator</h2>
        <p aria-live="polite">Loading…</p>
      </section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalculatorShellComponent {}
