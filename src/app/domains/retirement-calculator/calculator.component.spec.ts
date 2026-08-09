import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RetirementCalculatorComponent } from './calculator.component';
import { AssumptionDataService } from './assumption-data.service';
import { CalculatorService } from './calculator.service';
import { signal, WritableSignal } from '@angular/core';

describe('RetirementCalculatorComponent', () => {
  let component: RetirementCalculatorComponent;
  let fixture: ComponentFixture<RetirementCalculatorComponent>;

  // Mock Signal properties required for CalculatorService
  let currentNetWorthMockSignal: WritableSignal<number>;
  let yearsUntilRetirementMockSignal: WritableSignal<number>;
  let targetMonthlyIncomeMockSignal: WritableSignal<number>;
  let estimatedAnnualReturnMockSignal: WritableSignal<number>;
  let safeWithdrawalRateMockSignal: WritableSignal<number>;

  // Spy object mocks
  let mockAssumptionService: Partial<AssumptionDataService>;
  let mockCalculatorService: Partial<CalculatorService>;

  beforeEach(async () => {
    currentNetWorthMockSignal = signal(0);
    yearsUntilRetirementMockSignal = signal(40);
    targetMonthlyIncomeMockSignal = signal(4000);
    estimatedAnnualReturnMockSignal = signal(7);
    safeWithdrawalRateMockSignal = signal(4);

    mockAssumptionService = {
      safeWithdrawalRate: signal(4.0),
      estimatedAnnualReturn: signal(7.0),
      isLive: signal(true),
      inflationResource: {
        isLoading: signal(false),
      } as any,
    };

    mockCalculatorService = {
      currentNetWorth: currentNetWorthMockSignal,
      yearsUntilRetirement: yearsUntilRetirementMockSignal,
      targetMonthlyIncome: targetMonthlyIncomeMockSignal,
      estimatedAnnualReturn: estimatedAnnualReturnMockSignal,
      safeWithdrawalRate: safeWithdrawalRateMockSignal,
      totalNestEggNeeded: signal(1200000),
      futureNetWorth: signal(0),
      remainingTargetNestEgg: signal(1200000),
      requiredMonthlyContribution: signal(410.82),
    };

    await TestBed.configureTestingModule({
      imports: [RetirementCalculatorComponent],
      providers: [
        { provide: AssumptionDataService, useValue: mockAssumptionService },
        { provide: CalculatorService, useValue: mockCalculatorService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RetirementCalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize input signals with defaults from assumption data service', () => {
    expect(component.safeWithdrawalRate()).toBe(4.0);
    expect(component.estimatedAnnualReturn()).toBe(7.0);
    expect(component.targetMonthlyIncome()).toBe(4000);
    expect(component.yearsUntilRetirement()).toBe(40);
    expect(component.currentNetWorth()).toBe(0);
  });

  it('should calculate requiredNestEgg based on safeWithdrawalRate and targetMonthlyIncome', () => {
    // Default: (4000 * 12) / (4 / 100) = 48000 / 0.04 = 1,200,000
    expect(component.requiredNestEgg()).toBe(1200000);

    // Update safe withdrawal rate locally
    component.safeWithdrawalRate.set(5); // (4000 * 12) / 0.05 = 960,000
    expect(component.requiredNestEgg()).toBe(960000);
  });

  it('should return 0 for requiredNestEgg if safeWithdrawalRate is 0 or less', () => {
    component.safeWithdrawalRate.set(0);
    expect(component.requiredNestEgg()).toBe(0);
  });

  it('should pass calculated service properties through from CalculatorService', () => {
    expect(component.totalNestEggNeeded()).toBe(1200000);
    expect(component.futureNetWorth()).toBe(0);
    expect(component.remainingTargetNestEgg()).toBe(1200000);
    expect(component.requiredMonthlyContribution()).toBe(410.82);
  });

  it('should expose live status and loading state from AssumptionDataService', () => {
    expect(component.isLive()).toBeTruthy();
    expect(component.isLoading()).toBeFalsy();
  });

  describe('Select on focus', () => {
    const inputSelectors = [
      'input[aria-label="Current Net Worth in dollars"]',
      'input[aria-label="Years until retirement"]',
      'input[aria-label="Target monthly income in dollars"]',
      'input[aria-label="Estimated annual investment return percentage"]',
      'input[aria-label="Safe withdrawal rate percentage"]',
    ];

    inputSelectors.forEach(selector => {
      it(`should select all text when ${selector} receives focus`, () => {
        const input: HTMLInputElement = fixture.nativeElement.querySelector(selector);
        const selectSpy = vi.spyOn(input, 'select');
        input.dispatchEvent(new FocusEvent('focus'));
        expect(selectSpy).toHaveBeenCalled();
      });
    });
  });

  describe('Input change handlers', () => {
    it('should delegate onNetWorthChange to CalculatorService', () => {
      component.onNetWorthChange(50000);
      expect(mockCalculatorService.currentNetWorth?.()).toBe(50000);
    });

    it('should delegate onYearsChange to CalculatorService', () => {
      component.onYearsChange(25);
      expect(mockCalculatorService.yearsUntilRetirement?.()).toBe(25);
    });

    it('should delegate onTargetIncomeChange to CalculatorService', () => {
      component.onTargetIncomeChange(6000);
      expect(mockCalculatorService.targetMonthlyIncome?.()).toBe(6000);
    });

    it('should delegate onAnnualReturnChange to CalculatorService', () => {
      component.onAnnualReturnChange(8.5);
      expect(mockCalculatorService.estimatedAnnualReturn?.()).toBe(8.5);
    });

    it('should delegate onWithdrawalRateChange to CalculatorService', () => {
      component.onWithdrawalRateChange(3.5);
      expect(mockCalculatorService.safeWithdrawalRate?.()).toBe(3.5);
    });

    it('should default invalid/NaN inputs to 0 in handlers', () => {
      component.onNetWorthChange(NaN);
      expect(mockCalculatorService.currentNetWorth?.()).toBe(0);
    });
  });
});
