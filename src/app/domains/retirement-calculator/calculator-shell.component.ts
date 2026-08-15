import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RetirementCalculatorComponent } from './calculator.component';

@Component({
  selector: 'app-calculator-shell',
  imports: [RetirementCalculatorComponent],
  template: `
    @defer (on immediate) {
      <app-retirement-calculator />
    } @placeholder {
      <section class="calculator-container mx-auto max-w-5xl rounded-2xl px-4 py-8">
        <h2 class="text-2xl font-bold mb-6">Retirement Calculator</h2>
        <p aria-live="polite">Loading…</p>
      </section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalculatorShellComponent {}
