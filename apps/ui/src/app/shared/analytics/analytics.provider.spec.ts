import { TestBed } from '@angular/core/testing';
import { EnvironmentInjector } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { provideAnalytics } from './analytics.provider';
import { AnalyticsService } from './analytics.service';

describe('provideAnalytics()', () => {
  let events: Subject<NavigationEnd>;

  function configure(): void {
    events = new Subject<NavigationEnd>();
    TestBed.configureTestingModule({
      providers: [provideAnalytics(), { provide: Router, useValue: { events } }],
    });
  }

  afterEach(() => {
    delete (window as any).gtag;
    delete (window as any).dataLayer;
  });

  it('should track a page_view with urlAfterRedirects on NavigationEnd', () => {
    const trackSpy = vi
      .spyOn(AnalyticsService.prototype, 'trackPageView')
      .mockImplementation(() => {});

    configure();
    TestBed.inject(EnvironmentInjector);

    events.next(new NavigationEnd(1, '/first', '/retirement-calculator'));
    TestBed.tick();

    expect(trackSpy).toHaveBeenCalledWith('/retirement-calculator');

    trackSpy.mockRestore();
  });
});
