import { TestBed } from '@angular/core/testing';
import { EnvironmentInjector } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { AnalyticsService } from './analytics/analytics.service';
import { LocaleHeadService } from './i18n/locale-head.service';
import { provideNavigationHooks } from './navigation-hooks.provider';

describe('provideNavigationHooks()', () => {
  it('reports a page view and refreshes the language links after every navigation', () => {
    const trackPageView = vi
      .spyOn(AnalyticsService.prototype, 'trackPageView')
      .mockImplementation(() => {});
    const update = vi.spyOn(LocaleHeadService.prototype, 'update').mockImplementation(() => {});
    const events = new Subject<NavigationEnd>();

    TestBed.configureTestingModule({
      providers: [provideNavigationHooks(), { provide: Router, useValue: { events } }],
    });
    TestBed.inject(EnvironmentInjector);

    events.next(new NavigationEnd(1, '/first', '/privacy-policy'));
    TestBed.tick();

    expect(trackPageView).toHaveBeenCalledWith('/privacy-policy');
    expect(update).toHaveBeenCalledWith('/privacy-policy');

    trackPageView.mockRestore();
    update.mockRestore();
  });
});
