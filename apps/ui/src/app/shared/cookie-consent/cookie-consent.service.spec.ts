import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { CookieConsentService } from './cookie-consent.service';
import { AnalyticsService } from '../analytics/analytics.service';

describe('CookieConsentService', () => {
  let updateConsent: ReturnType<typeof vi.fn>;
  let enable: ReturnType<typeof vi.fn>;
  let trackPageView: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    updateConsent = vi.fn();
    enable = vi.fn();
    trackPageView = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        { provide: AnalyticsService, useValue: { updateConsent, enable, trackPageView } },
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  it('clears the stored choice, denies consent, and shows the banner again on resetChoice()', () => {
    const service = TestBed.inject(CookieConsentService);
    service.accept();
    updateConsent.mockClear();

    service.resetChoice();

    expect(service.showBanner()).toBe(true);
    expect(localStorage.getItem('cookie-consent')).toBeNull();
    expect(updateConsent).toHaveBeenCalledWith({
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  });

  it('loads nothing from Google until the visitor accepts', () => {
    TestBed.inject(CookieConsentService);

    expect(enable).not.toHaveBeenCalled();
    expect(updateConsent).not.toHaveBeenCalled();
  });

  it('loads analytics and reports the current page on accept()', () => {
    TestBed.inject(CookieConsentService).accept();

    expect(enable).toHaveBeenCalledOnce();
    expect(trackPageView).toHaveBeenCalledOnce();
  });

  it('never loads analytics on reject()', () => {
    TestBed.inject(CookieConsentService).reject();

    expect(enable).not.toHaveBeenCalled();
  });

  it('honours an earlier accept on the next page load', () => {
    localStorage.setItem('cookie-consent', 'accepted');

    TestBed.inject(CookieConsentService);

    expect(enable).toHaveBeenCalledOnce();
    expect(updateConsent).toHaveBeenCalledWith(
      expect.objectContaining({ analytics_storage: 'granted' }),
    );
  });

  it('does not load analytics after an earlier reject', () => {
    localStorage.setItem('cookie-consent', 'rejected');

    TestBed.inject(CookieConsentService);

    expect(enable).not.toHaveBeenCalled();
  });

  it('survives blocked storage: shows the banner and the choice still applies', () => {
    const blocked = () => {
      throw new DOMException('denied', 'SecurityError');
    };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(blocked);

    const service = TestBed.inject(CookieConsentService);
    expect(service.showBanner()).toBe(true);

    service.accept();
    expect(service.showBanner()).toBe(false);
    expect(enable).toHaveBeenCalledOnce();

    service.resetChoice();
    expect(service.showBanner()).toBe(true);
  });
});
