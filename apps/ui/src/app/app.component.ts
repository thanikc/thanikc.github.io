import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { CookieConsentBannerComponent } from './shared/cookie-consent/cookie-consent-banner.component';
import { CtaTrackingDirective } from './shared/analytics/cta-tracking.directive';
import { ChatShellComponent } from './domains/chat/chat-shell.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    CookieConsentBannerComponent,
    ChatShellComponent,
  ],
  hostDirectives: [CtaTrackingDirective],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
