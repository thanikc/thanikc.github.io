import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RetirementCalculatorComponent } from './calculator.component';

@Component({
  selector: 'app-calculator-shell',
  imports: [RetirementCalculatorComponent],
  template: `
    @defer (on immediate) {
      <app-retirement-calculator />
    } @placeholder {
      <!-- min-h matches the rendered calculator so the footer does not jump
           when the defer block resolves. -->
      <section class="min-h-160">
        <h1 class="text-2xl font-bold mb-6">Retirement Calculator</h1>
        <p aria-live="polite">Loading…</p>
      </section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalculatorShellComponent {}
