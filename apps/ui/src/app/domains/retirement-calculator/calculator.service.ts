import { Injectable, LOCALE_ID, computed, inject, linkedSignal, signal } from '@angular/core';
import { AssumptionDataService } from './assumption-data.service';
import {
  CURRENCY_BY_LANGUAGE,
  INPUT_BOUNDS,
  LONG_RUN_REAL_RETURN,
  MONTHS_PER_YEAR,
  RETURN_SPREAD,
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
  private readonly defaults = {
    netWorth: 0,
    years: 30,
    monthlyIncome: this.localCurrency.monthlyIncome,
  };
  readonly currentNetWorth = signal(this.defaults.netWorth);
  readonly yearsUntilRetirement = signal(this.defaults.years);
  readonly targetMonthlyIncome = signal(this.defaults.monthlyIncome);

  // --- Adjustable assumptions: user-writable, reseeded whenever live data arrives ---
  readonly estimatedAnnualReturn = linkedSignal(() => this.assumptions.estimatedAnnualReturn());
  readonly safeWithdrawalRate = linkedSignal(() => this.assumptions.safeWithdrawalRate());

  /** Whether every input is inside the range the results are meaningful for. */
  readonly inputsValid = computed(
    () =>
      this.currentNetWorth() >= 0 &&
      this.targetMonthlyIncome() >= 0 &&
      Number.isInteger(this.yearsUntilRetirement()) &&
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

  /** Monthly contribution that closes the gap by the retirement date at the given real return (%). */
  private contributionAt(returnPct: number): number {
    const years = this.yearsUntilRetirement();
    const rate = (returnPct || 0) / 100;
    const gap = Math.max(
      0,
      this.totalNestEggNeeded() - this.currentNetWorth() * Math.pow(1 + rate, years),
    );

    if (years <= 0 || gap <= 0) return 0;

    const monthlyRate = rate / MONTHS_PER_YEAR;
    const totalMonths = years * MONTHS_PER_YEAR;

    if (monthlyRate === 0) {
      return gap / totalMonths;
    }

    // Payment of an annuity whose future value is the gap: PMT = FV * r / ((1 + r)^n - 1)
    return gap * (monthlyRate / (Math.pow(1 + monthlyRate, totalMonths) - 1));
  }

  /** Monthly contribution that closes the remaining gap by the retirement date. */
  readonly requiredMonthlyContribution = computed(() =>
    this.contributionAt(this.estimatedAnnualReturn()),
  );

  /**
   * The saving if real returns run RETURN_SPREAD points higher (low) or lower (high) than
   * chosen. Null while an input is invalid or when even the lower return reaches the goal.
   */
  readonly contributionRange = computed(() => {
    if (!this.inputsValid()) return null;

    const high = this.contributionAt(this.estimatedAnnualReturn() - RETURN_SPREAD);
    if (high === 0) return null;

    return { low: this.contributionAt(this.estimatedAnnualReturn() + RETURN_SPREAD), high };
  });

  /**
   * The chart's two paths, one point per year from today (0) to retirement: what
   * the net worth grows to on its own, and that plus the required monthly saving,
   * which lands on the goal. Same compounding as the figures above (annual on the
   * net worth, monthly on contributions). Empty while an input is invalid.
   */
  readonly trajectory = computed(() => {
    if (!this.inputsValid()) return [];

    const years = this.yearsUntilRetirement();
    const rate = this.estimatedAnnualReturn() / 100;
    const monthlyRate = rate / MONTHS_PER_YEAR;
    const contribution = this.requiredMonthlyContribution();

    return Array.from({ length: years + 1 }, (_, year) => {
      const months = year * MONTHS_PER_YEAR;
      const withoutSaving = this.currentNetWorth() * Math.pow(1 + rate, year);
      const saved =
        monthlyRate === 0
          ? contribution * months
          : (contribution * (Math.pow(1 + monthlyRate, months) - 1)) / monthlyRate;
      return { year, withSaving: withoutSaving + saved, withoutSaving };
    });
  });

  /** Back to the page's starting values, with the live assumptions. */
  reset(): void {
    this.currentNetWorth.set(this.defaults.netWorth);
    this.yearsUntilRetirement.set(this.defaults.years);
    this.targetMonthlyIncome.set(this.defaults.monthlyIncome);
    this.estimatedAnnualReturn.set(this.assumptions.estimatedAnnualReturn());
    this.safeWithdrawalRate.set(this.assumptions.safeWithdrawalRate());
  }
}
