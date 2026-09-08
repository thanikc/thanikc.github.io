import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { vi } from 'vitest';
import { AnalyticsService } from './analytics.service';

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

      service.trackPageView('/');

      expect((window as any).gtag).toHaveBeenCalledWith(
        'event',
        'page_view',
        expect.objectContaining({
          page_title: document.title,
          page_path: '/',
          page_location: window.location.origin + '/',
        }),
      );
    });

    it('should no-op when gtag is undefined', () => {
      expect(() => service.trackPageView('/')).not.toThrow();
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
});
