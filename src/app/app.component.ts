import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { AdBannerComponent } from './domains/ads/ad-banner.component';
import { AdBannerService } from './domains/ads/ad-banner.service';
import { CookieConsentBannerComponent } from './shared/cookie-consent/cookie-consent-banner.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    AdBannerComponent,
    CookieConsentBannerComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  readonly showBanner = inject(AdBannerService).showBanner.asReadonly();
}
