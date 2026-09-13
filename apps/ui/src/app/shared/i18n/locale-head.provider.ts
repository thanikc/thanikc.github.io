import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { LocaleHeadService } from './locale-head.service';

/**
 * Declares the canonical URL and the other languages of each route as it is
 * navigated to — including during prerendering, which is what puts them in the
 * static HTML the crawler sees.
 */
export function provideLocaleHead(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideEnvironmentInitializer(() => {
      const links = inject(LocaleHeadService);

      inject(Router)
        .events.pipe(
          filter((event): event is NavigationEnd => event instanceof NavigationEnd),
          takeUntilDestroyed(),
        )
        .subscribe(event => links.update(event.urlAfterRedirects));
    }),
  ]);
}
