import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AnalyticsService } from './analytics.service';

/**
 * Reports every completed navigation to Google Analytics as a page view.
 * gtag.js itself (including the measurement id) is bootstrapped in src/index.html
 * so it is present in the prerendered HTML.
 */
export function provideAnalytics(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideEnvironmentInitializer(() => {
      const analytics = inject(AnalyticsService);

      inject(Router)
        .events.pipe(
          filter((event): event is NavigationEnd => event instanceof NavigationEnd),
          takeUntilDestroyed(),
        )
        .subscribe(event => analytics.trackPageView(event.urlAfterRedirects));
    }),
  ]);
}
