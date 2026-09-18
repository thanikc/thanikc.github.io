import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { CookieConsentService } from '../../shared/cookie-consent/cookie-consent.service';

@Component({
  selector: 'app-privacy-policy',
  imports: [MatButtonModule, DatePipe],
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPolicyComponent {
  private readonly consent = inject(CookieConsentService);

  // Static legal content: no reactivity needed. A Date, not a string: the template
  // formats it with the date pipe so each locale prints the date its own way.
  readonly lastUpdated = new Date(2026, 8, 18);
  readonly contactEmail = 'thanikc@gmail.com';

  reopenCookieBanner(): void {
    this.consent.resetChoice();
  }
}
