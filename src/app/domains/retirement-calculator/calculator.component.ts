import { ChangeDetectionStrategy, Component, inject, WritableSignal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { CalculatorService } from './calculator.service';
import { AssumptionsInfoCardComponent } from './assumptions-info-card.component';
import { AssumptionDataService } from './assumption-data.service';
import { SelectOnFocusDirective } from '../../shared/directives/select-on-focus.directive';

@Component({
  selector: 'app-retirement-calculator',
  imports: [
    CurrencyPipe,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatExpansionModule,
    AssumptionsInfoCardComponent,
    SelectOnFocusDirective,
  ],
  templateUrl: './calculator.component.html',
  styleUrl: './calculator.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RetirementCalculatorComponent {
  private readonly assumptions = inject(AssumptionDataService);
  private readonly calculator = inject(CalculatorService);

  // Editable state lives in CalculatorService; the template binds to it directly.
  readonly currentNetWorth = this.calculator.currentNetWorth;
  readonly yearsUntilRetirement = this.calculator.yearsUntilRetirement;
  readonly targetMonthlyIncome = this.calculator.targetMonthlyIncome;
  readonly estimatedAnnualReturn = this.calculator.estimatedAnnualReturn;
  readonly safeWithdrawalRate = this.calculator.safeWithdrawalRate;

  // Derived results.
  readonly totalNestEggNeeded = this.calculator.totalNestEggNeeded;
  readonly futureNetWorth = this.calculator.futureNetWorth;
  readonly remainingTargetNestEgg = this.calculator.remainingTargetNestEgg;
  readonly requiredMonthlyContribution = this.calculator.requiredMonthlyContribution;

  // Live data status.
  readonly isLive = this.assumptions.isLive;
  readonly isLoading = this.assumptions.isLoading;

  /** Writes a numeric form value, falling back to 0 for empty or invalid input. */
  updateAmount(target: WritableSignal<number>, value: number): void {
    target.set(Number(value) || 0);
  }
}
