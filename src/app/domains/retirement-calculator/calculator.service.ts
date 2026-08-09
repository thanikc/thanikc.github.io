import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CalculatorService {
  // --- Core Inputs (Writable Signals) ---
  currentNetWorth = signal<number>(0);
  yearsUntilRetirement = signal<number>(30);
  targetMonthlyIncome = signal<number>(4000);

  // --- Adjustable Assumptions (Writable Signals with Sensible Defaults) ---
  estimatedAnnualReturn = signal<number>(7); // Default: 7% annual market return
  safeWithdrawalRate = signal<number>(4); // Default: 4% Safe Withdrawal Rate (Trinity Study)

  // --- Computed Signals ---

  // Total target nest egg needed based on annual withdrawal rate assumption
  totalNestEggNeeded = computed(() => {
    const swrDecimal = (this.safeWithdrawalRate() || 4) / 100;
    if (swrDecimal <= 0) return 0;
    const annualIncomeNeeded = this.targetMonthlyIncome() * 12;
    return annualIncomeNeeded / swrDecimal;
  });

  // Future value of current net worth compounded until retirement
  futureNetWorth = computed(() => {
    const rateDecimal = (this.estimatedAnnualReturn() || 0) / 100;
    const years = this.yearsUntilRetirement();
    return this.currentNetWorth() * Math.pow(1 + rateDecimal, years);
  });

  // Remaining nest egg needed to reach retirement goal
  remainingTargetNestEgg = computed(() => {
    const remaining = this.totalNestEggNeeded() - this.futureNetWorth();
    return Math.max(0, remaining);
  });

  // Monthly contribution needed to bridge the remaining gap
  requiredMonthlyContribution = computed(() => {
    const years = this.yearsUntilRetirement();
    const gap = this.remainingTargetNestEgg();

    if (years <= 0 || gap <= 0) return 0;

    const annualRateDecimal = (this.estimatedAnnualReturn() || 0) / 100;
    const monthlyRate = annualRateDecimal / 12;
    const totalMonths = years * 12;

    if (monthlyRate <= 0) {
      return gap / totalMonths;
    }

    // Future Value of an Annuity formula: FV = PMT * (((1 + r)^n - 1) / r)
    return gap * (monthlyRate / (Math.pow(1 + monthlyRate, totalMonths) - 1));
  });
}
