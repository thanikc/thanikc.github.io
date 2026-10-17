import { Injectable, LOCALE_ID, computed, inject, linkedSignal, signal } from '@angular/core';
import { AssumptionDataService } from './assumption-data.service';
import {
  CURRENCY_BY_LANGUAGE,
  INPUT_BOUNDS,
  LONG_RUN_REAL_RETURN,
  MONTHS_PER_YEAR,
} from './calculator.constants';

const within = (value: number, { min, max }: { min: number; max: number }) =>
  value >= min && value <= max;

@Injectable({ providedIn: 'root' })
export class CalculatorService {
  private readonly assumptions = inject(AssumptionDataService);
  private readonly localCurrency =
    CURRENCY_BY_LANGUAGE[inject(LOCALE_ID).split('-')[0]] ?? CURRENCY_BY_LANGUAGE['en'];

  /** ISO code every amount is shown in: the visitor's own currency for this locale build. */
  readonly currency = this.localCurrency.code;

  // --- Core inputs ---
  readonly currentNetWorth = signal(0);
  readonly yearsUntilRetirement = signal(30);
  readonly targetMonthlyIncome = signal(this.localCurrency.monthlyIncome);

  // --- Adjustable assumptions: user-writable, reseeded whenever live data arrives ---
  readonly estimatedAnnualReturn = linkedSignal(() => this.assumptions.estimatedAnnualReturn());
  readonly safeWithdrawalRate = linkedSignal(() => this.assumptions.safeWithdrawalRate());

  /** Whether every input is inside the range the results are meaningful for. */
  readonly inputsValid = computed(
    () =>
      this.currentNetWorth() >= 0 &&
      this.targetMonthlyIncome() >= 0 &&
      within(this.yearsUntilRetirement(), INPUT_BOUNDS.years) &&
      within(this.estimatedAnnualReturn(), INPUT_BOUNDS.annualReturn) &&
      within(this.safeWithdrawalRate(), INPUT_BOUNDS.withdrawalRate),
  );

  /** Above the long-run real average, the result is a best case. */
  readonly isReturnOptimistic = computed(() => this.estimatedAnnualReturn() > LONG_RUN_REAL_RETURN);

  /** Target nest egg that sustains the desired income at the safe withdrawal rate. */
  readonly totalNestEggNeeded = computed(() => {
    const withdrawalRate = this.safeWithdrawalRate() / 100;
    if (withdrawalRate <= 0) return 0;

    return (this.targetMonthlyIncome() * MONTHS_PER_YEAR) / withdrawalRate;
  });

  /** Future value of the current net worth compounded until retirement. */
  readonly futureNetWorth = computed(() => {
    const rate = (this.estimatedAnnualReturn() || 0) / 100;

    return this.currentNetWorth() * Math.pow(1 + rate, this.yearsUntilRetirement());
  });

  /** Nest egg still to be funded after the current net worth has compounded. */
  readonly remainingTargetNestEgg = computed(() =>
    Math.max(0, this.totalNestEggNeeded() - this.futureNetWorth()),
  );

  /** Monthly contribution that closes the remaining gap by the retirement date. */
  readonly requiredMonthlyContribution = computed(() => {
    const years = this.yearsUntilRetirement();
    const gap = this.remainingTargetNestEgg();

    if (years <= 0 || gap <= 0) return 0;

    const monthlyRate = (this.estimatedAnnualReturn() || 0) / 100 / MONTHS_PER_YEAR;
    const totalMonths = years * MONTHS_PER_YEAR;

    if (monthlyRate <= 0) {
      return gap / totalMonths;
    }

    // Payment of an annuity whose future value is the gap: PMT = FV * r / ((1 + r)^n - 1)
    return gap * (monthlyRate / (Math.pow(1 + monthlyRate, totalMonths) - 1));
  });
}
