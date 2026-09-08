import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { CookieConsentService } from '../../shared/cookie-consent/cookie-consent.service';

@Component({
  selector: 'app-privacy-policy',
  imports: [MatButtonModule],
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPolicyComponent {
  private readonly consent = inject(CookieConsentService);

  // Static legal content: no reactivity needed.
  readonly lastUpdated = 'August 20, 2026';
  readonly contactEmail = 'thanikc@gmail.com';

  reopenCookieBanner(): void {
    this.consent.resetChoice();
  }
}
