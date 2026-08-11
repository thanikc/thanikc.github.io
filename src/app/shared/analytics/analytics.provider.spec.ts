import { TestBed } from '@angular/core/testing';
import { EnvironmentInjector } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { provideAnalytics } from './analytics.provider';
import { AnalyticsService } from './analytics.service';
import { GA_MEASUREMENT_ID } from './ga-measurement-id.token';

describe('provideAnalytics()', () => {
  let events: Subject<NavigationEnd>;

  function configure(measurementId: string): void {
    events = new Subject<NavigationEnd>();
    TestBed.configureTestingModule({
      providers: [provideAnalytics(measurementId), { provide: Router, useValue: { events } }],
    });
  }

  afterEach(() => {
    delete (window as any).gtag;
    delete (window as any).dataLayer;
  });

  it('should provide the configured measurement id via GA_MEASUREMENT_ID', () => {
    configure('G-TEST');

    expect(TestBed.inject(GA_MEASUREMENT_ID)).toBe('G-TEST');
  });

  it('should call AnalyticsService.initialize() once via the environment initializer', () => {
    const initSpy = vi.spyOn(AnalyticsService.prototype, 'initialize').mockImplementation(() => {});

    configure('G-TEST');
    TestBed.inject(EnvironmentInjector);

    expect(initSpy).toHaveBeenCalledTimes(1);

    initSpy.mockRestore();
  });

  it('should track a page_view with urlAfterRedirects on NavigationEnd', () => {
    const trackSpy = vi
      .spyOn(AnalyticsService.prototype, 'trackPageView')
      .mockImplementation(() => {});

    configure('G-TEST');
    TestBed.inject(EnvironmentInjector);

    events.next(new NavigationEnd(1, '/first', '/retirement-calculator'));
    TestBed.tick();

    expect(trackSpy).toHaveBeenCalledWith('/retirement-calculator');

    trackSpy.mockRestore();
  });
});
