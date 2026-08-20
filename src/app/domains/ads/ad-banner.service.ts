import { Injectable, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';

/** Site-wide ads master switch. Currently off: the AdSense script tags in
 * `index.html` are commented out (not removed) to match. To bring ads back,
 * flip this to `true` and restore those tags. */
export const ADS_ENABLED = false;

/** Route data flag: set `data: { ads: false }` on routes with no substantial publisher content
 * (e.g. interactive tools), so AdSense never serves ads on a screen it would flag as low-value. */
function deepestRouteAllowsAds(route: ActivatedRoute): boolean {
  let current = route;
  while (current.firstChild) {
    current = current.firstChild;
  }
  return current.snapshot.data['ads'] !== false;
}

@Injectable({
  providedIn: 'root',
})
export class AdBannerService {
  readonly adsEnabled = ADS_ENABLED;
  readonly showBanner = signal<boolean>(ADS_ENABLED);

  private readonly router = inject(Router);
  private readonly rootRoute = inject(ActivatedRoute);

  readonly routeAllowsAds = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => deepestRouteAllowsAds(this.rootRoute)),
    ),
    { initialValue: deepestRouteAllowsAds(this.rootRoute) },
  );
}
