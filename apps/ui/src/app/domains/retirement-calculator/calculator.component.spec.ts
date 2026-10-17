import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { RetirementCalculatorComponent } from './calculator.component';
import { AssumptionDataService } from './assumption-data.service';
import { CalculatorService } from './calculator.service';

describe('RetirementCalculatorComponent', () => {
  let component: RetirementCalculatorComponent;
  let fixture: ComponentFixture<RetirementCalculatorComponent>;

  // Editable state owned by CalculatorService
  let currentNetWorthMockSignal: WritableSignal<number>;
  let yearsUntilRetirementMockSignal: WritableSignal<number>;
  let targetMonthlyIncomeMockSignal: WritableSignal<number>;
  let estimatedAnnualReturnMockSignal: WritableSignal<number>;
  let safeWithdrawalRateMockSignal: WritableSignal<number>;

  let inputsValidMockSignal: WritableSignal<boolean>;
  let isReturnOptimisticMockSignal: WritableSignal<boolean>;

  let mockAssumptionService: Partial<AssumptionDataService>;
  let mockCalculatorService: Partial<CalculatorService>;

  const el = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    currentNetWorthMockSignal = signal(0);
    yearsUntilRetirementMockSignal = signal(40);
    targetMonthlyIncomeMockSignal = signal(4000);
    estimatedAnnualReturnMockSignal = signal(7);
    safeWithdrawalRateMockSignal = signal(4);

    inputsValidMockSignal = signal(true);
    isReturnOptimisticMockSignal = signal(false);

    mockAssumptionService = {
      isLive: signal(true),
      isLoading: signal(false),
      returnPeriod: signal({ from: 1995, to: 2024 }),
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
      inputsValid: inputsValidMockSignal,
      isReturnOptimistic: isReturnOptimisticMockSignal,
      currency: 'USD',
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

  it('should expose the editable state owned by CalculatorService', () => {
    expect(component.safeWithdrawalRate()).toBe(4);
    expect(component.estimatedAnnualReturn()).toBe(7);
    expect(component.targetMonthlyIncome()).toBe(4000);
    expect(component.yearsUntilRetirement()).toBe(40);
    expect(component.currentNetWorth()).toBe(0);
  });

  it('should reflect service state changes in the exposed signals', () => {
    currentNetWorthMockSignal.set(50000);

    expect(component.currentNetWorth()).toBe(50000);
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
      'input[aria-label="Current net worth"]',
      'input[aria-label="Years until retirement"]',
      'input[aria-label="Target monthly income"]',
      'input[aria-label="Annual return after inflation, in percent"]',
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

  describe('updateAmount()', () => {
    it('should write the value into the target service signal', () => {
      component.updateAmount(component.currentNetWorth, 50000);
      expect(currentNetWorthMockSignal()).toBe(50000);

      component.updateAmount(component.yearsUntilRetirement, 25);
      expect(yearsUntilRetirementMockSignal()).toBe(25);

      component.updateAmount(component.targetMonthlyIncome, 6000);
      expect(targetMonthlyIncomeMockSignal()).toBe(6000);

      component.updateAmount(component.estimatedAnnualReturn, 8.5);
      expect(estimatedAnnualReturnMockSignal()).toBe(8.5);

      component.updateAmount(component.safeWithdrawalRate, 3.5);
      expect(safeWithdrawalRateMockSignal()).toBe(3.5);
    });

    it('should default invalid/NaN input to 0', () => {
      component.updateAmount(component.currentNetWorth, NaN);
      expect(currentNetWorthMockSignal()).toBe(0);
    });
  });

  describe('template bindings', () => {
    it('should render the current service values in the number inputs', async () => {
      currentNetWorthMockSignal.set(12345);
      fixture.detectChanges();
      // NgModel writes the value to the DOM in a microtask.
      await fixture.whenStable();

      const input: HTMLInputElement = fixture.nativeElement.querySelector(
        'input[aria-label="Current net worth"]',
      );

      expect(input.value).toBe('12345');
    });
  });

  describe('document structure', () => {
    // The calculator is the whole page on /calculator, so its title is the page
    // title. Starting the outline at <h2> skipped the top level entirely.
    it('titles the page with exactly one h1', () => {
      const el = fixture.nativeElement as HTMLElement;

      expect(el.querySelectorAll('h1').length).toBe(1);
      expect(el.querySelector('h1')?.textContent).toContain('Retirement Calculator');
    });

    // Both forms are always rendered; a media query picks one, so the collapsed
    // header never has to wrap or clip the live numbers.
    it('offers a full and a compact summary of the assumptions', () => {
      const description = (fixture.nativeElement as HTMLElement).querySelector(
        'mat-panel-description',
      );

      expect(description?.textContent).toContain('7% real return, 4% withdrawal rate');
      expect(description?.textContent).toContain('7% / 4%');
    });
  });

  describe('trustworthy results', () => {
    const results = () => [...el().querySelectorAll('.summary-cards .card p')];

    it('shows no figures while an input is out of range', () => {
      inputsValidMockSignal.set(false);
      fixture.detectChanges();

      expect(results().map(p => p.textContent?.trim())).toEqual(['—', '—', '—', '—']);
    });

    it('says which range a field accepts once it is left invalid', async () => {
      const input = el().querySelector<HTMLInputElement>(
        'input[aria-label="Safe withdrawal rate percentage"]',
      )!;
      input.value = '0';
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(el().querySelector('mat-error')?.textContent).toContain('between 0.5% and 10%');
    });

    it('names the source and period of the live return', () => {
      expect(el().textContent).toContain('1995–2024');
    });

    it('warns when the return is above the long-run average', () => {
      expect(el().textContent).not.toContain('best case');

      isReturnOptimisticMockSignal.set(true);
      fixture.detectChanges();

      expect(el().textContent).toContain('best case');
    });

    // Screen-reader users change an input and need to hear the answer, once,
    // without the four cards all re-announcing.
    it('announces the monthly answer in one polite live region', () => {
      const live = el().querySelectorAll('p[aria-live="polite"]');

      expect(live.length).toBe(1);
      expect(live[0].textContent).toContain('$411');
    });

    it('shows amounts in the currency of the locale build', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [RetirementCalculatorComponent],
        providers: [
          { provide: AssumptionDataService, useValue: mockAssumptionService },
          { provide: CalculatorService, useValue: { ...mockCalculatorService, currency: 'EUR' } },
        ],
      }).compileComponents();
      fixture = TestBed.createComponent(RetirementCalculatorComponent);
      fixture.detectChanges();

      expect(results()[0].textContent).toContain('€');
      expect(el().querySelector('[matprefix]')?.textContent).toContain('€');
    });
  });
});
