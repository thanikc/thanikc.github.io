import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { CookieConsentService } from './cookie-consent.service';
import { AnalyticsService } from '../analytics/analytics.service';

describe('CookieConsentService', () => {
  let updateConsent: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    updateConsent = vi.fn();

    TestBed.configureTestingModule({
      providers: [{ provide: AnalyticsService, useValue: { updateConsent } }],
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('shows the banner when no choice has been stored', () => {
    const service = TestBed.inject(CookieConsentService);

    expect(service.showBanner()).toBe(true);
  });

  it('hides the banner and grants consent on accept()', () => {
    const service = TestBed.inject(CookieConsentService);

    service.accept();

    expect(service.showBanner()).toBe(false);
    expect(localStorage.getItem('cookie-consent')).toBe('accepted');
    expect(updateConsent).toHaveBeenCalledWith({
      analytics_storage: 'granted',
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
    });
  });

  it('hides the banner and denies consent on reject()', () => {
    const service = TestBed.inject(CookieConsentService);

    service.reject();

    expect(service.showBanner()).toBe(false);
    expect(localStorage.getItem('cookie-consent')).toBe('rejected');
    expect(updateConsent).toHaveBeenCalledWith({
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  });

  it('does not show the banner again once a choice was already stored', () => {
    localStorage.setItem('cookie-consent', 'accepted');

    const service = TestBed.inject(CookieConsentService);

    expect(service.showBanner()).toBe(false);
  });
});
