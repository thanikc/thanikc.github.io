import {
  makeEnvironmentProviders,
  EnvironmentProviders,
  provideEnvironmentInitializer,
  inject,
  effect,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AnalyticsService } from './analytics.service';
import { GA_MEASUREMENT_ID } from './ga-measurement-id.token';

export function provideAnalytics(measurementId = 'G-HSC8QB0EQL'): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: GA_MEASUREMENT_ID, useValue: measurementId },
    provideEnvironmentInitializer(() => {
      const service = inject(AnalyticsService);
      const router = inject(Router);

      service.initialize();

      const navigationEnd = toSignal(
        router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)),
      );

      effect(() => {
        const event = navigationEnd();
        if (event) {
          service.trackPageView(event.urlAfterRedirects);
        }
      });
    }),
  ]);
}
