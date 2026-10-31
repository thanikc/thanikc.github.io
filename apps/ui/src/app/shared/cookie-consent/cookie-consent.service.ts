import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AnalyticsService, ConsentState, ConsentUpdate } from '../analytics/analytics.service';

export type ConsentChoice = 'accepted' | 'rejected';

const STORAGE_KEY = 'cookie-consent';

const consentOf = (state: ConsentState): ConsentUpdate => ({
  analytics_storage: state,
  ad_storage: state,
  ad_user_data: state,
  ad_personalization: state,
});

@Injectable({
  providedIn: 'root',
})
export class CookieConsentService {
  private readonly analytics = inject(AnalyticsService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly choice = signal<ConsentChoice | null>(
    this.isBrowser ? this.readStoredChoice() : null,
  );

  /** Only shown once, in the browser, until the user makes a choice. */
  readonly showBanner = computed(() => this.isBrowser && this.choice() === null);

  /** The banner's rendered height in px, so other bottom-anchored UI can clear it. */
  readonly bannerHeight = signal(0);

  constructor() {
    if (this.choice() === 'accepted') this.grant();
  }

  accept(): void {
    this.setChoice('accepted');
    this.grant();
    // The navigation that brought the visitor here had no analytics to report to yet.
    this.analytics.trackPageView();
  }

  reject(): void {
    this.setChoice('rejected');
    this.analytics.updateConsent(consentOf('denied'));
  }

  /** Lets the user withdraw consent as easily as it was given: clears the
   * stored choice, denies all consent-gated storage, and re-shows the banner. */
  resetChoice(): void {
    this.setChoice(null);
    this.analytics.updateConsent(consentOf('denied'));
  }

  private grant(): void {
    this.analytics.enable();
    this.analytics.updateConsent(consentOf('granted'));
  }

  /** Blocked storage must not cost the visitor the site; the choice then lasts this page view. */
  private setChoice(choice: ConsentChoice | null): void {
    this.choice.set(choice);
    try {
      if (choice) localStorage.setItem(STORAGE_KEY, choice);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignored: see above.
    }
  }

  private readStoredChoice(): ConsentChoice | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'accepted' || stored === 'rejected' ? stored : null;
    } catch {
      return null;
    }
  }
}
