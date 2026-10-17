import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  linkedSignal,
  inject,
  WritableSignal,
} from '@angular/core';
import { CurrencyPipe, getCurrencySymbol } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CalculatorService } from './calculator.service';
import { AssumptionsInfoCardComponent } from './assumptions-info-card.component';
import { AssumptionDataService } from './assumption-data.service';
import { INPUT_BOUNDS, LONG_RUN_REAL_RETURN } from './calculator.constants';
/** The chart's drawing space; the SVG stretches it to the frame (non-scaling strokes). */
const CHART_W = 1000;
const CHART_H = 400;
/** Headroom above the higher of the goal and the savings path. */
const CHART_HEADROOM = 1.15;

import { SelectOnFocusDirective } from '../../shared/directives/select-on-focus.directive';

@Component({
  selector: 'app-retirement-calculator',
  imports: [
    CurrencyPipe,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    AssumptionsInfoCardComponent,
    SelectOnFocusDirective,
  ],
  templateUrl: './calculator.component.html',
  styleUrl: './calculator.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RetirementCalculatorComponent {
  private readonly assumptions = inject(AssumptionDataService);
  private readonly calculator = inject(CalculatorService);

  // Editable state lives in CalculatorService; the template binds to it directly.
  readonly currentNetWorth = this.calculator.currentNetWorth;
  readonly yearsUntilRetirement = this.calculator.yearsUntilRetirement;
  readonly targetMonthlyIncome = this.calculator.targetMonthlyIncome;
  readonly estimatedAnnualReturn = this.calculator.estimatedAnnualReturn;
  readonly safeWithdrawalRate = this.calculator.safeWithdrawalRate;

  // Amounts are shown in the locale build's currency.
  readonly currency = this.calculator.currency;
  readonly currencySymbol = getCurrencySymbol(this.currency, 'narrow', inject(LOCALE_ID));

  readonly bounds = INPUT_BOUNDS;
  readonly longRunReturn = LONG_RUN_REAL_RETURN;
  readonly inputsValid = this.calculator.inputsValid;
  readonly isReturnOptimistic = this.calculator.isReturnOptimistic;

  // Derived results.
  readonly totalNestEggNeeded = this.calculator.totalNestEggNeeded;
  readonly futureNetWorth = this.calculator.futureNetWorth;
  readonly remainingTargetNestEgg = this.calculator.remainingTargetNestEgg;
  readonly requiredMonthlyContribution = this.calculator.requiredMonthlyContribution;

  // Live data status.
  readonly isLive = this.assumptions.isLive;
  readonly isLoading = this.assumptions.isLoading;
  readonly returnPeriod = this.assumptions.returnPeriod;

  /**
   * The trajectory as SVG paths: the savings path, the no-saving path, the gap
   * between them and the goal line. Each path also comes as a CSS `path()` value,
   * so browsers that animate `d` (Chromium, Firefox) redraw the curve smoothly as
   * an input changes; the attribute keeps it drawn everywhere else.
   */
  private readonly liveChart = computed(() => {
    const points = this.calculator.trajectory();
    if (!this.inputsValid() || points.length < 2) return null;

    const goal = this.totalNestEggNeeded();
    const top = Math.max(goal, ...points.map(p => p.withSaving)) * CHART_HEADROOM || 1;
    const lastYear = points[points.length - 1].year;
    const x = (year: number) => ((year / lastYear) * CHART_W).toFixed(1);
    const y = (value: number) => (CHART_H - (value / top) * CHART_H).toFixed(1);
    const path = (key: 'withSaving' | 'withoutSaving', from = points) =>
      from.map((p, i) => `${i ? 'L' : 'M'}${x(p.year)},${y(p[key])}`).join('');

    const withSaving = path('withSaving');
    const withoutSaving = path('withoutSaving');
    const gap = `${withSaving}${path('withoutSaving', [...points].reverse()).replace('M', 'L')}Z`;
    const css = (d: string) => `path("${d}")`;

    const withoutEnd = points[points.length - 1].withoutSaving;
    const withoutEndPct = (1 - withoutEnd / top) * 100;

    return {
      goal,
      endYear: new Date().getFullYear() + lastYear,
      hasNetWorth: this.currentNetWorth() > 0,
      withoutEnd,
      withoutEndPct,
      // Its label hangs under the line, clear of the goal label above; in the bottom
      // fifth there is no room under it, so it sits above instead.
      withoutLabelAbove: withoutEndPct > 80,
      withSaving,
      withoutSaving,
      gap,
      withSavingCss: css(withSaving),
      withoutSavingCss: css(withoutSaving),
      gapCss: css(gap),
      goalY: y(goal),
      goalPct: (1 - goal / top) * 100,
    };
  });

  /** The chart on screen: the live one, or the last valid one while an input is invalid. */
  readonly chart = linkedSignal<
    ReturnType<typeof this.liveChart>,
    ReturnType<typeof this.liveChart>
  >({
    source: this.liveChart,
    computation: (next, previous) => next ?? previous?.value ?? null,
  });

  /**
   * Writes a numeric form value. An emptied field stays missing (NaN), so the
   * inputs read as invalid instead of quietly becoming 0.
   */
  updateAmount(target: WritableSignal<number>, value: number | null): void {
    target.set(value === null ? NaN : Number(value));
  }

  /**
   * An emptied field is held as NaN; the input shows it as empty (null), so the
   * required validator flags it — `required` treats NaN as a value.
   */
  shown(value: number): number | null {
    return Number.isNaN(value) ? null : value;
  }

  reset(): void {
    this.calculator.reset();
  }
}
