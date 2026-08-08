import { TestBed } from '@angular/core/testing';
import { CalculatorService } from './calculator.service';

describe('CalculatorService', () => {
  let service: CalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CalculatorService);
  });

  it('should initialize with default parameters and sensible assumption defaults', () => {
    expect(service.currentNetWorth()).toBe(0);
    expect(service.yearsUntilRetirement()).toBe(30);
    expect(service.targetMonthlyIncome()).toBe(4000);
    expect(service.estimatedAnnualReturn()).toBe(7); // Default 7%
    expect(service.safeWithdrawalRate()).toBe(4); // Default 4%
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
