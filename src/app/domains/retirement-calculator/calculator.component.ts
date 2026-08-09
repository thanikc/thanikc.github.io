import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  standalone: true,
  imports: [
    CommonModule,
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
})
export class RetirementCalculatorComponent {
  private readonly assumptionService = inject(AssumptionDataService);
  private readonly service = inject(CalculatorService);

  // Writable inputs initialized with sensible dynamic values
  readonly safeWithdrawalRate = signal(this.assumptionService.safeWithdrawalRate());
  readonly estimatedAnnualReturn = signal(this.assumptionService.estimatedAnnualReturn());

  readonly targetMonthlyIncome = signal(4000);
  readonly yearsUntilRetirement = signal(40);
  readonly currentNetWorth = signal(0);

  // --- Computed signals (readonly pass-throughs to the service) ---
  readonly totalNestEggNeeded = this.service.totalNestEggNeeded;
  readonly futureNetWorth = this.service.futureNetWorth;
  readonly remainingTargetNestEgg = this.service.remainingTargetNestEgg;
  readonly requiredMonthlyContribution = this.service.requiredMonthlyContribution;

  // Expose live status & indicators directly to template
  readonly isLive = this.assumptionService.isLive;
  readonly isLoading = this.assumptionService.inflationResource.isLoading;

  // Computed calculations update automatically when signals change
  readonly requiredNestEgg = computed(() => {
    const rate = this.safeWithdrawalRate() / 100;
    return rate > 0 ? (this.targetMonthlyIncome() * 12) / rate : 0;
  });

  constructor() {
    effect(
      () => {
        const safeWithdrawalRate = this.assumptionService.safeWithdrawalRate();
        this.safeWithdrawalRate.set(safeWithdrawalRate);
        this.service.safeWithdrawalRate.set(safeWithdrawalRate);
      },
      { allowSignalWrites: true },
    );

    effect(
      () => {
        const estimatedAnnualReturn = this.assumptionService.estimatedAnnualReturn();
        this.estimatedAnnualReturn.set(estimatedAnnualReturn);
        this.service.estimatedAnnualReturn.set(estimatedAnnualReturn);
      },
      { allowSignalWrites: true },
    );
  }

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
    const num = Number(value) || 0;
    this.estimatedAnnualReturn.set(num);
    this.service.estimatedAnnualReturn.set(num);
  }

  onWithdrawalRateChange(value: number): void {
    const num = Number(value) || 0;
    this.safeWithdrawalRate.set(num);
    this.service.safeWithdrawalRate.set(num);
  }
}
