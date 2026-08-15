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
import { GA_MEASUREMENT_ID } from './ga-measurement-id.token';

const DEFAULT_MEASUREMENT_ID = 'G-HSC8QB0EQL';

/** Reports every completed navigation to Google Analytics as a page view. */
export function provideAnalytics(measurementId = DEFAULT_MEASUREMENT_ID): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: GA_MEASUREMENT_ID, useValue: measurementId },
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
