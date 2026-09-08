import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatSlideToggle, MatSlideToggleChange } from '@angular/material/slide-toggle';
import { AdBannerService } from './ad-banner.service';

@Component({
  selector: 'app-ad-banner-toggle',
  imports: [MatSlideToggle],
  template: `<mat-slide-toggle [checked]="showBanner()" (change)="onToggleChange($event)"
    >ads</mat-slide-toggle
  >`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdBannerToggleComponent {
  private readonly ads = inject(AdBannerService);

  readonly showBanner = this.ads.showBanner.asReadonly();

  onToggleChange(event: MatSlideToggleChange): void {
    this.ads.showBanner.set(event.checked);
  }
}
