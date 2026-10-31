import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { vi } from 'vitest';
import { AnalyticsService } from './analytics.service';

const DISABLE_FLAG = 'ga-disable-G-HSC8QB0EQL';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let document: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnalyticsService);
    document = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    delete (window as any).gtag;
    delete (window as any).dataLayer;
    delete (window as any)[DISABLE_FLAG];
    document.head
      .querySelectorAll('script[src*="googletagmanager.com/gtag/js"]')
      .forEach(script => script.remove());
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('trackPageView()', () => {
    it('should call gtag with a page_view event', () => {
      (window as any).gtag = vi.fn();

      service.trackPageView();

      // The real address, so each language build reports as its own page.
      expect((window as any).gtag).toHaveBeenCalledWith(
        'event',
        'page_view',
        expect.objectContaining({
          page_title: document.title,
          page_path: window.location.pathname,
          page_location: window.location.href,
        }),
      );
    });

    it('should no-op when gtag is undefined', () => {
      expect(() => service.trackPageView()).not.toThrow();
    });
  });

  describe('trackEvent()', () => {
    it('should forward the event name and params to gtag', () => {
      (window as any).gtag = vi.fn();

      service.trackEvent('click', { category: 'nav' });

      expect((window as any).gtag).toHaveBeenCalledWith('event', 'click', {
        category: 'nav',
      });
    });

    it('should no-op when gtag is undefined', () => {
      expect(() => service.trackEvent('click')).not.toThrow();
    });
  });

  describe('enable()', () => {
    const scripts = () => document.head.querySelectorAll('script[src*="googletagmanager.com"]');

    it('adds the gtag.js script once, and configures it without an automatic page view', () => {
      service.enable();
      service.enable();

      expect(scripts()).toHaveLength(1);
      const queued = ((window as any).dataLayer as IArguments[]).map(call => [...call]);
      expect(queued).toContainEqual([
        'config',
        'G-HSC8QB0EQL',
        expect.objectContaining({ send_page_view: false }),
      ]);
    });

    it('queues calls as an arguments object, the form gtag.js reads', () => {
      service.enable();

      expect(Array.isArray((window as any).dataLayer[0])).toBe(false);
      expect((window as any).dataLayer[0].length).toBeGreaterThan(0);
    });
  });

  describe('updateConsent()', () => {
    const consent = (state: 'granted' | 'denied') => ({
      analytics_storage: state,
      ad_storage: state,
      ad_user_data: state,
      ad_personalization: state,
    });

    it('switches an already loaded gtag.js off on denial, and back on', () => {
      (window as any).gtag = vi.fn();

      service.updateConsent(consent('denied'));
      expect((window as any)[DISABLE_FLAG]).toBe(true);

      service.updateConsent(consent('granted'));
      expect((window as any)[DISABLE_FLAG]).toBe(false);
    });
  });
});
