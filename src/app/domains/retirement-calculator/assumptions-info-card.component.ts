import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-assumptions-info-card',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './assumptions-info-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssumptionsInfoCardComponent {
  readonly isLive = input<boolean>(false);
  readonly isLoading = input<boolean>(false);
  readonly safeWithdrawalRate = input<number>(4.0);
  readonly estimatedAnnualReturn = input<number>(7.0);
}
