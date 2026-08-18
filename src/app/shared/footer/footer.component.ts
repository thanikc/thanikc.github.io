import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AdBannerToggleComponent } from '../../domains/ads/ad-banner-toggle.component';

@Component({
  selector: 'app-footer',
  imports: [AdBannerToggleComponent],
  templateUrl: './footer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {}
