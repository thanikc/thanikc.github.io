import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AnalyticsService } from './analytics/analytics.service';
import { LocaleHeadService } from './i18n/locale-head.service';

/**
 * On every completed navigation: reports a Google Analytics page view, and declares the
 * route's canonical URL and other languages. Runs during prerendering too, which is what
 * puts the language links in the static HTML the crawler sees. gtag.js itself (including
 * the measurement id) is bootstrapped in src/index.html so it is in that HTML as well.
 */
export function provideNavigationHooks(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideEnvironmentInitializer(() => {
      const analytics = inject(AnalyticsService);
      const localeHead = inject(LocaleHeadService);

      inject(Router)
        .events.pipe(
          filter((event): event is NavigationEnd => event instanceof NavigationEnd),
          takeUntilDestroyed(),
        )
        .subscribe(({ urlAfterRedirects }) => {
          analytics.trackPageView(urlAfterRedirects);
          localeHead.update(urlAfterRedirects);
        });
    }),
  ]);
}
