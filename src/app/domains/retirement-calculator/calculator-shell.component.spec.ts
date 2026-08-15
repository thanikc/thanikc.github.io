import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeferBlockBehavior, DeferBlockState } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { CalculatorShellComponent } from './calculator-shell.component';
import { AssumptionDataService } from './assumption-data.service';
import { CalculatorService } from './calculator.service';

describe('CalculatorShellComponent', () => {
  let fixture: ComponentFixture<CalculatorShellComponent>;

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
      isLoading: signal(false),
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
      imports: [CalculatorShellComponent],
      providers: [
        { provide: AssumptionDataService, useValue: mockAssumptionService },
        { provide: CalculatorService, useValue: mockCalculatorService },
      ],
      deferBlockBehavior: DeferBlockBehavior.Manual,
    }).compileComponents();
  });

  it('renders static placeholder (heading) before the defer block completes', () => {
    fixture = TestBed.createComponent(CalculatorShellComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('h2')?.textContent).toContain('Retirement Calculator');
    expect(el.querySelector('app-retirement-calculator')).toBeNull();
  });

  it('renders the calculator component once the defer block completes', async () => {
    fixture = TestBed.createComponent(CalculatorShellComponent);
    fixture.detectChanges();
    const deferBlocks = await fixture.getDeferBlocks();
    await deferBlocks[0].render(DeferBlockState.Complete);
    expect(fixture.nativeElement.querySelector('app-retirement-calculator')).not.toBeNull();
  });
});
