import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AnalyticsService } from '../analytics/analytics.service';

export type ConsentChoice = 'accepted' | 'rejected';

const STORAGE_KEY = 'cookie-consent';

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

  accept(): void {
    this.setChoice('accepted');
  }

  reject(): void {
    this.setChoice('rejected');
  }

  private setChoice(choice: ConsentChoice): void {
    this.choice.set(choice);
    localStorage.setItem(STORAGE_KEY, choice);

    const state = choice === 'accepted' ? 'granted' : 'denied';
    this.analytics.updateConsent({
      analytics_storage: state,
      ad_storage: state,
      ad_user_data: state,
      ad_personalization: state,
    });
  }

  private readStoredChoice(): ConsentChoice | null {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'accepted' || stored === 'rejected' ? stored : null;
  }
}
