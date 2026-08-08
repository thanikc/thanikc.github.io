import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RetirementCalculatorComponent } from './calculator.component';
import { CalculatorService } from './calculator.service';

describe('RetirementCalculatorComponent', () => {
  let component: RetirementCalculatorComponent;
  let fixture: ComponentFixture<RetirementCalculatorComponent>;
  let service: CalculatorService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RetirementCalculatorComponent],
    }).compileComponents();

    // CalculatorService is provided in root, so it is auto-provided for the
    // standalone component. Grab the same singleton instance to verify delegation.
    service = TestBed.inject(CalculatorService);

    fixture = TestBed.createComponent(RetirementCalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize with default parameters and sensible assumption defaults', () => {
    expect(component.currentNetWorth()).toBe(0);
    expect(component.yearsUntilRetirement()).toBe(30);
    expect(component.targetMonthlyIncome()).toBe(4000);
    expect(component.estimatedAnnualReturn()).toBe(7); // Default 7%
    expect(component.safeWithdrawalRate()).toBe(4); // Default 4%
  });

  it('should update safe withdrawal rate and adjust total nest egg goal', () => {
    component.targetMonthlyIncome.set(4000);
    component.safeWithdrawalRate.set(4);
    const initialGoal = component.totalNestEggNeeded(); // $48,000 / 0.04 = $1,200,000

    // Lower withdrawal rate should increase the required nest egg
    component.safeWithdrawalRate.set(3);
    const updatedGoal = component.totalNestEggNeeded(); // $48,000 / 0.03 = $1,600,000

    expect(updatedGoal).toBeGreaterThan(initialGoal);
  });

  it('should update estimated annual return and recalculate compound growth', () => {
    component.currentNetWorth.set(50000);
    component.yearsUntilRetirement.set(20);

    component.estimatedAnnualReturn.set(5);
    const returnAt5Percent = component.futureNetWorth();

    component.estimatedAnnualReturn.set(8);
    const returnAt8Percent = component.futureNetWorth();

    expect(returnAt8Percent).toBeGreaterThan(returnAt5Percent);
  });

  it('should delegate state to the CalculatorService (shared singleton)', () => {
    // Component signals are pass-throughs to the service singleton.
    expect(component.currentNetWorth).toBe(service.currentNetWorth);
    expect(component.totalNestEggNeeded).toBe(service.totalNestEggNeeded);

    // A change handler on the component updates the service's signal.
    component.onNetWorthChange(12345);
    expect(service.currentNetWorth()).toBe(12345);
    expect(component.currentNetWorth()).toBe(12345);
  });
});
