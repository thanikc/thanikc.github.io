import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DEFAULT_ANNUAL_RETURN, DEFAULT_SAFE_WITHDRAWAL_RATE } from './calculator.constants';

@Component({
  selector: 'app-assumptions-info-card',
  imports: [MatCardModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './assumptions-info-card.component.html',
  styleUrl: './assumptions-info-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssumptionsInfoCardComponent {
  readonly isLive = input(false);
  readonly isLoading = input(false);
  readonly safeWithdrawalRate = input(DEFAULT_SAFE_WITHDRAWAL_RATE);
  readonly estimatedAnnualReturn = input(DEFAULT_ANNUAL_RETURN);
  /** Years the live return covers; null when the baseline is in use. */
  readonly returnPeriod = input<{ from: number; to: number } | null>(null);

  readonly baselineReturn = DEFAULT_ANNUAL_RETURN;
}
