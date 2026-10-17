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
  let monthlyMockSignal: WritableSignal<number>;
  const resetSpy = vi.fn();

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
    monthlyMockSignal = signal(410.82);
    resetSpy.mockClear();

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
      requiredMonthlyContribution: monthlyMockSignal,
      inputsValid: inputsValidMockSignal,
      isReturnOptimistic: isReturnOptimisticMockSignal,
      currency: 'USD',
      trajectory: signal([
        { year: 0, withSaving: 0, withoutSaving: 0 },
        { year: 20, withSaving: 400_000, withoutSaving: 0 },
        { year: 40, withSaving: 1_200_000, withoutSaving: 0 },
      ]),
      reset: resetSpy,
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

    // An emptied field stays missing (and so invalid) rather than quietly 0.
    it('keeps an emptied field empty instead of turning it into 0', () => {
      component.updateAmount(component.currentNetWorth, null);
      expect(currentNetWorthMockSignal()).toBeNaN();
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
      expect(el.querySelector('h1')?.textContent).toContain('Retirement calculator');
    });

    it('says in one line what the calculator is for', () => {
      expect(
        (fixture.nativeElement as HTMLElement).querySelector('.calc-purpose')?.textContent,
      ).toContain("today's money");
    });
  });

  describe('trustworthy results', () => {
    const answer = () => el().querySelector('.calc-answer')!;

    // The last valid chart stays, dimmed, so the frame isn't an empty block; the
    // sentence says what to do.
    it('dims the last valid chart while an input is out of range, and says what to do', () => {
      inputsValidMockSignal.set(false);
      fixture.detectChanges();

      expect(answer().textContent).toContain('Fix the highlighted field');
      expect(el().querySelector('.calc-chart-frame')?.classList).toContain('is-stale');
      expect(el().querySelector('.calc-chart path.calc-with-saving')).not.toBeNull();
      expect(el().querySelector('.calc-legend')).toBeNull();
      yearsUntilRetirementMockSignal.set(NaN);
      fixture.detectChanges();
      expect(el().textContent).not.toContain('NaN');
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

    it('flags an emptied field as an error, not a quiet zero', async () => {
      targetMonthlyIncomeMockSignal.set(NaN);
      fixture.detectChanges();
      await fixture.whenStable();
      const input = el().querySelector<HTMLInputElement>(
        'input[aria-label="Target monthly income"]',
      )!;
      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      // Material leaves aria-invalid off an empty required field; the field state
      // and its error text carry it.
      expect(input.value).toBe('');
      expect(input.closest('mat-form-field')?.classList).toContain('mat-form-field-invalid');
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
    // The answer is one sentence, and it is the page's single polite live region.
    it('answers in one sentence: the monthly saving, for how long, for what income', () => {
      const live = el().querySelectorAll('p[aria-live="polite"]');

      expect(live.length).toBe(1);
      expect(live[0]).toBe(answer());
      const text = answer().textContent!.replace(/\s+/g, ' ');
      expect(text).toContain('$411');
      expect(text).toContain('40 years');
      expect(text).toContain('$4,000');
    });

    it('says so when what you have already reaches the goal', () => {
      monthlyMockSignal.set(0);
      fixture.detectChanges();

      expect(answer().textContent).toContain('on track');
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

      expect(el().querySelector('.calc-goal-label')?.textContent).toContain('€');
      expect(el().querySelector('[matprefix]')?.textContent).toContain('€');
    });
  });

  describe('trajectory chart', () => {
    const chart = () => el().querySelector('svg.calc-chart')!;

    it('draws the savings path, the gap and the goal', () => {
      expect(chart().querySelector('path.calc-with-saving')?.getAttribute('d')).toMatch(/^M/);
      expect(chart().querySelector('path.calc-gap')).not.toBeNull();
      expect(chart().querySelector('line.calc-goal')).not.toBeNull();
    });

    // Nothing in the first view reads "$0": with nothing saved yet there is no
    // no-saving path, end label or legend entry to show.
    it('draws the no-saving path only when there is a net worth to grow', () => {
      expect(chart().querySelector('path.calc-without-saving')).toBeNull();
      expect(el().querySelector('.calc-without-label')).toBeNull();
      expect(el().querySelector('.calc-legend-without')).toBeNull();

      currentNetWorthMockSignal.set(50_000);
      fixture.detectChanges();

      expect(chart().querySelector('path.calc-without-saving')).not.toBeNull();
      expect(el().querySelector('.calc-without-label')?.textContent).toContain('on its own');
    });

    // The net-worth input's key names the no-saving line; with no line drawn it
    // would point at nothing.
    it('keys the net-worth input only while its line is drawn', () => {
      expect(el().querySelector('.calc-key-without')).toBeNull();

      currentNetWorthMockSignal.set(50_000);
      fixture.detectChanges();

      expect(el().querySelector('.calc-key-without')).not.toBeNull();
    });

    // End labels are placed in % of the plot box; measured against the whole frame
    // (axis and legend included) a low end landed on the legend.
    it('places the end labels against the plot, not the axis and legend', () => {
      currentNetWorthMockSignal.set(50_000);
      fixture.detectChanges();

      const plot = el().querySelector('.calc-plot')!;
      expect(plot.querySelector('svg.calc-chart')).not.toBeNull();
      expect(plot.querySelector('.calc-goal-label')).not.toBeNull();
      expect(plot.querySelector('.calc-without-label')).not.toBeNull();
      expect(plot.querySelector('.calc-chart-axis')).toBeNull();
    });

    // Under its line by default, clear of the goal label; near the floor there is
    // no room under it, so it sits above.
    it('lifts the no-saving label above its line when the line ends near the floor', () => {
      currentNetWorthMockSignal.set(50_000);
      fixture.detectChanges();
      expect(el().querySelector('.calc-without-label')?.classList).toContain('is-above');

      (mockCalculatorService.trajectory as WritableSignal<unknown>).set([
        { year: 0, withSaving: 50_000, withoutSaving: 50_000 },
        { year: 40, withSaving: 1_200_000, withoutSaving: 700_000 },
      ]);
      fixture.detectChanges();
      expect(el().querySelector('.calc-without-label')?.classList).not.toContain('is-above');
    });

    it('labels where the paths end: the goal', () => {
      expect(el().querySelector('.calc-goal-label')?.textContent).toContain('$1,200,000');
    });

    // The sentence carries the answer in text.
    it('is decoration for assistive tech: the sentence carries the answer', () => {
      expect(chart().closest('[aria-hidden="true"]')).not.toBeNull();
    });

    it('labels where the path starts and the year it ends', () => {
      const labels = el().querySelector('.calc-chart-axis')!.textContent!;
      expect(labels).toContain('Today');
      expect(labels).toContain(String(new Date().getFullYear() + 40));
    });
  });

  it('keeps the maths one click away, collapsed', () => {
    const details = el().querySelector<HTMLDetailsElement>('details.calc-method')!;

    expect(details.open).toBe(false);
    expect(details.querySelector('summary')?.textContent).toContain('How this is calculated');
    expect(details.querySelector('app-assumptions-info-card')).not.toBeNull();
  });

  it('resets the inputs to where the page started', () => {
    el().querySelector<HTMLButtonElement>('button.calc-reset')!.click();
    expect(resetSpy).toHaveBeenCalled();
  });
});
