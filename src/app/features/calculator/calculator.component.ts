import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { CalculatorService } from './calculator.service';
import { AssumptionsInfoCardComponent } from './assumptions-info-card.component';

@Component({
  selector: 'app-retirement-calculator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatExpansionModule,
    AssumptionsInfoCardComponent,
  ],
  templateUrl: './calculator.component.html',
  styleUrl: './calculator.component.scss',
})
export class RetirementCalculatorComponent {
  private readonly service = inject(CalculatorService);

  // --- Writable signals (readonly pass-throughs to the service) ---
  readonly currentNetWorth = this.service.currentNetWorth;
  readonly yearsUntilRetirement = this.service.yearsUntilRetirement;
  readonly targetMonthlyIncome = this.service.targetMonthlyIncome;
  readonly estimatedAnnualReturn = this.service.estimatedAnnualReturn;
  readonly safeWithdrawalRate = this.service.safeWithdrawalRate;

  // --- Computed signals (readonly pass-throughs to the service) ---
  readonly totalNestEggNeeded = this.service.totalNestEggNeeded;
  readonly futureNetWorth = this.service.futureNetWorth;
  readonly remainingTargetNestEgg = this.service.remainingTargetNestEgg;
  readonly requiredMonthlyContribution = this.service.requiredMonthlyContribution;

  // Input change handlers (thin delegation to the service)
  onNetWorthChange(value: number): void {
    this.service.currentNetWorth.set(Number(value) || 0);
  }

  onYearsChange(value: number): void {
    this.service.yearsUntilRetirement.set(Number(value) || 0);
  }

  onTargetIncomeChange(value: number): void {
    this.service.targetMonthlyIncome.set(Number(value) || 0);
  }

  onAnnualReturnChange(value: number): void {
    this.service.estimatedAnnualReturn.set(Number(value) || 0);
  }

  onWithdrawalRateChange(value: number): void {
    this.service.safeWithdrawalRate.set(Number(value) || 0);
  }
}
