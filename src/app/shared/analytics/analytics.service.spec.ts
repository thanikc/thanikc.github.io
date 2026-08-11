import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { vi } from 'vitest';
import { AnalyticsService } from './analytics.service';
import { GA_MEASUREMENT_ID } from './ga-measurement-id.token';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let document: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: GA_MEASUREMENT_ID, useValue: 'G-TEST' }],
    });
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

  describe('initialize()', () => {
    it('should bootstrap window.dataLayer and window.gtag with a js call', () => {
      service.initialize();

      expect((window as any).dataLayer).toBeDefined();
      expect(typeof (window as any).gtag).toBe('function');
      expect((window as any).dataLayer.some((call: unknown[]) => call[0] === 'js')).toBe(true);
    });

    it('should push a config call with the configured measurement id', () => {
      service.initialize();

      expect(
        (window as any).dataLayer.some(
          (call: unknown[]) => call[0] === 'config' && call[1] === 'G-TEST',
        ),
      ).toBe(true);
    });

    it('should append the gtag.js script with the configured id', () => {
      service.initialize();

      const script = document.head.querySelector<HTMLScriptElement>(
        'script[src*="googletagmanager.com/gtag/js"]',
      );

      expect(script).not.toBeNull();
      expect(script?.src).toBe(`https://www.googletagmanager.com/gtag/js?id=G-TEST`);
      expect(script?.async).toBe(true);
    });

    it('should not append a duplicate script when initialized twice', () => {
      service.initialize();
      service.initialize();

      const scripts = document.head.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]');
      expect(scripts.length).toBe(1);
    });
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
