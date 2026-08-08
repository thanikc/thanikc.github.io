import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-assumptions-info-card',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  templateUrl: './assumptions-info-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssumptionsInfoCardComponent {
  /** Safe Withdrawal Rate percentage (e.g., 4) */
  readonly safeWithdrawalRate = input.required<number>();

  /** Estimated Annual Return percentage (e.g., 7) */
  readonly estimatedAnnualReturn = input.required<number>();
}
