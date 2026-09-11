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
    expect(el.querySelector('h1')?.textContent).toContain('Retirement Calculator');
    expect(el.querySelector('app-retirement-calculator')).toBeNull();
  });

  it('renders the calculator component once the defer block completes', async () => {
    fixture = TestBed.createComponent(CalculatorShellComponent);
    fixture.detectChanges();
    const deferBlocks = await fixture.getDeferBlocks();
    await deferBlocks[0].render(DeferBlockState.Complete);
    expect(fixture.nativeElement.querySelector('app-retirement-calculator')).not.toBeNull();
  });

  // The placeholder is swapped for a much taller calculator; without a reserved
  // box the footer jumps down the moment the defer block resolves. One 640px box
  // only fitted desktop: the Playwright design check measured the calculator at
  // 1388px (360), 988px (640), 784px (768) and 658px (1024). The host reserves the
  // measured height per breakpoint, in both states, so neither swap shifts layout.
  it('reserves the calculator’s measured height per breakpoint on the host', () => {
    fixture = TestBed.createComponent(CalculatorShellComponent);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    for (const cls of [
      'block',
      'min-h-[1390px]',
      'sm:min-h-[990px]',
      'md:min-h-[785px]',
      'lg:min-h-[660px]',
    ]) {
      expect(host.classList.contains(cls), cls).toBe(true);
    }
  });
});
