import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { AdBannerComponent } from './domains/ads/ad-banner.component';
import { AdBannerService } from './domains/ads/ad-banner.service';
import { CookieConsentBannerComponent } from './shared/cookie-consent/cookie-consent-banner.component';
import { CtaTrackingDirective } from './shared/analytics/cta-tracking.directive';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    AdBannerComponent,
    CookieConsentBannerComponent,
  ],
  hostDirectives: [CtaTrackingDirective],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly adBanner = inject(AdBannerService);

  readonly showBanner = computed(
    () => this.adBanner.showBanner() && this.adBanner.routeAllowsAds(),
  );
}
