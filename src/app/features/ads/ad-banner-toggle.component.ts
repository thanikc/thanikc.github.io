import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { MatSlideToggle, MatSlideToggleChange } from '@angular/material/slide-toggle';
import { AdBannerService } from './ad-banner.service';

@Component({
  selector: 'app-ad-banner-toggle',
  imports: [MatSlideToggle],
  template: `<mat-slide-toggle [checked]="isToggled()" (change)="onToggleChange($event)"
    >ads</mat-slide-toggle
  > `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdBannerToggleComponent {
  private readonly service = inject(AdBannerService);

  isToggled = signal(true);

  onToggleChange(event: MatSlideToggleChange) {
    this.service.showBanner.set(event.checked);
  }
}
