import { LOCALE_ID, signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AssumptionDataService } from './assumption-data.service';
import { DEFAULT_ANNUAL_RETURN, DEFAULT_SAFE_WITHDRAWAL_RATE } from './calculator.constants';
import { CalculatorService } from './calculator.service';

describe('CalculatorService', () => {
  let service: CalculatorService;
  let liveAnnualReturn: WritableSignal<number>;
  let liveSafeWithdrawalRate: WritableSignal<number>;

  beforeEach(() => {
    liveAnnualReturn = signal(DEFAULT_ANNUAL_RETURN);
    liveSafeWithdrawalRate = signal(DEFAULT_SAFE_WITHDRAWAL_RATE);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AssumptionDataService,
          useValue: {
            estimatedAnnualReturn: liveAnnualReturn,
            safeWithdrawalRate: liveSafeWithdrawalRate,
          } satisfies Partial<AssumptionDataService>,
        },
      ],
    });
    service = TestBed.inject(CalculatorService);
  });

  it('should initialize with default parameters and sensible assumption defaults', () => {
    expect(service.currentNetWorth()).toBe(0);
    expect(service.yearsUntilRetirement()).toBe(30);
    expect(service.targetMonthlyIncome()).toBe(4000);
    expect(service.estimatedAnnualReturn()).toBe(DEFAULT_ANNUAL_RETURN);
    expect(service.safeWithdrawalRate()).toBe(4); // Default 4%
    expect(service.currency).toBe('USD');
  });

  // --- Input validity: results are only meaningful inside these bounds ---

  it('accepts the defaults as valid input', () => {
    expect(service.inputsValid()).toBe(true);
  });

  it.each([
    ['a zero withdrawal rate', (s: CalculatorService) => s.safeWithdrawalRate.set(0)],
    ['a withdrawal rate above 10%', (s: CalculatorService) => s.safeWithdrawalRate.set(12)],
    ['zero years', (s: CalculatorService) => s.yearsUntilRetirement.set(0)],
    ['negative years', (s: CalculatorService) => s.yearsUntilRetirement.set(-5)],
    ['more than 80 years', (s: CalculatorService) => s.yearsUntilRetirement.set(81)],
    ['a return above 15%', (s: CalculatorService) => s.estimatedAnnualReturn.set(16)],
    ['a return below -5%', (s: CalculatorService) => s.estimatedAnnualReturn.set(-6)],
    ['a negative net worth', (s: CalculatorService) => s.currentNetWorth.set(-1)],
    ['a negative income', (s: CalculatorService) => s.targetMonthlyIncome.set(-1)],
  ])('rejects %s', (_, change) => {
    change(service);
    expect(service.inputsValid()).toBe(false);
  });

  // An emptied field is not a 0: it is missing, and the results must say so.
  it('treats an emptied field as invalid, not as zero', () => {
    service.targetMonthlyIncome.set(NaN);
    expect(service.inputsValid()).toBe(false);
  });

  // The chart: one point per year from today to retirement, the savings path
  // landing on the goal and the no-saving path landing on the compounded net worth.
  it('traces the savings path from today to the goal, year by year', () => {
    service.currentNetWorth.set(50_000);
    service.yearsUntilRetirement.set(20);
    service.estimatedAnnualReturn.set(5);
    const points = service.trajectory();

    expect(points).toHaveLength(21);
    expect(points[0]).toEqual({ year: 0, withSaving: 50_000, withoutSaving: 50_000 });
    expect(points[20].withSaving).toBeCloseTo(service.totalNestEggNeeded(), -2);
    expect(points[20].withoutSaving).toBeCloseTo(service.futureNetWorth(), 6);
    expect(points[10].withSaving).toBeGreaterThan(points[10].withoutSaving);
  });

  it('traces nothing while an input is invalid', () => {
    service.yearsUntilRetirement.set(0);
    expect(service.trajectory()).toEqual([]);
  });

  it('resets every input to where the page started', () => {
    service.currentNetWorth.set(1);
    service.yearsUntilRetirement.set(2);
    service.targetMonthlyIncome.set(3);
    service.estimatedAnnualReturn.set(9);
    service.safeWithdrawalRate.set(3);

    service.reset();

    expect(service.currentNetWorth()).toBe(0);
    expect(service.yearsUntilRetirement()).toBe(30);
    expect(service.targetMonthlyIncome()).toBe(4000);
    expect(service.estimatedAnnualReturn()).toBe(DEFAULT_ANNUAL_RETURN);
    expect(service.safeWithdrawalRate()).toBe(4);
  });

  // No silent substitution: a 0% rate is invalid, not quietly computed at 4%.
  it('does not compute the goal from a default the visitor did not enter', () => {
    service.safeWithdrawalRate.set(0);
    expect(service.totalNestEggNeeded()).toBe(0);
  });

  // Above the long-run real average the result is a best case, and says so.
  it('flags a return above the long-run real average as optimistic', () => {
    service.estimatedAnnualReturn.set(7);
    expect(service.isReturnOptimistic()).toBe(false);

    service.estimatedAnnualReturn.set(7.5);
    expect(service.isReturnOptimistic()).toBe(true);
  });

  it('should update safe withdrawal rate and adjust total nest egg goal', () => {
    service.targetMonthlyIncome.set(4000);
    service.safeWithdrawalRate.set(4);
    const initialGoal = service.totalNestEggNeeded(); // $48,000 / 0.04 = $1,200,000

    // Lower withdrawal rate should increase the required nest egg
    service.safeWithdrawalRate.set(3);
    const updatedGoal = service.totalNestEggNeeded(); // $48,000 / 0.03 = $1,600,000

    expect(updatedGoal).toBeGreaterThan(initialGoal);
  });

  it('should update estimated annual return and recalculate compound growth', () => {
    service.currentNetWorth.set(50000);
    service.yearsUntilRetirement.set(20);

    service.estimatedAnnualReturn.set(5);
    const returnAt5Percent = service.futureNetWorth();

    service.estimatedAnnualReturn.set(8);
    const returnAt8Percent = service.futureNetWorth();

    expect(returnAt8Percent).toBeGreaterThan(returnAt5Percent);
  });

  // --- Live assumption seeding ---

  it('should adopt live assumptions when the macroeconomic data resolves', () => {
    liveAnnualReturn.set(9.5);
    liveSafeWithdrawalRate.set(3.5);

    expect(service.estimatedAnnualReturn()).toBe(9.5);
    expect(service.safeWithdrawalRate()).toBe(3.5);
  });

  it('should keep a user override until new live data arrives', () => {
    service.estimatedAnnualReturn.set(12);
    expect(service.estimatedAnnualReturn()).toBe(12);

    liveAnnualReturn.set(9.5);
    expect(service.estimatedAnnualReturn()).toBe(9.5);
  });

  // --- Edge cases ---

  it('should use linear division for required contribution when return is 0%', () => {
    service.currentNetWorth.set(0);
    service.yearsUntilRetirement.set(10);
    service.targetMonthlyIncome.set(4000);
    service.safeWithdrawalRate.set(4);
    service.estimatedAnnualReturn.set(0);

    // No compounding: futureNetWorth stays 0, gap == totalNestEggNeeded ($1,200,000)
    const gap = service.remainingTargetNestEgg();
    const totalMonths = 10 * 12;

    expect(service.futureNetWorth()).toBe(0);
    expect(service.requiredMonthlyContribution()).toBeCloseTo(gap / totalMonths, 6);
  });

  it('should return 0 required contribution when years until retirement is 0', () => {
    service.yearsUntilRetirement.set(0);
    service.currentNetWorth.set(0);

    expect(service.requiredMonthlyContribution()).toBe(0);
  });

  it('should clamp remaining nest egg to 0 when future net worth exceeds the goal (negative gap)', () => {
    service.targetMonthlyIncome.set(4000);
    service.safeWithdrawalRate.set(4); // goal = $1,200,000
    service.currentNetWorth.set(10_000_000); // already far exceeds the goal
    service.yearsUntilRetirement.set(30);
    service.estimatedAnnualReturn.set(7);

    expect(service.futureNetWorth()).toBeGreaterThan(service.totalNestEggNeeded());
    expect(service.remainingTargetNestEgg()).toBe(0);
    expect(service.requiredMonthlyContribution()).toBe(0);
  });
});

describe('CalculatorService per locale', () => {
  const create = (locale: string) => {
    TestBed.configureTestingModule({
      providers: [
        { provide: LOCALE_ID, useValue: locale },
        {
          provide: AssumptionDataService,
          useValue: {
            estimatedAnnualReturn: signal(DEFAULT_ANNUAL_RETURN),
            safeWithdrawalRate: signal(DEFAULT_SAFE_WITHDRAWAL_RATE),
          } satisfies Partial<AssumptionDataService>,
        },
      ],
    });
    return TestBed.inject(CalculatorService);
  };

  // Amounts are in the visitor's own currency, with a target income that is a
  // plausible starting point in that currency rather than a converted dollar figure.
  it.each([
    ['en', 'USD', 4000],
    ['de', 'EUR', 3000],
    ['th', 'THB', 40000],
  ])('uses %s → %s with a %d monthly target', (locale, currency, income) => {
    const service = create(locale);

    expect(service.currency).toBe(currency);
    expect(service.targetMonthlyIncome()).toBe(income);
  });
});
