import { Directive, HostListener, inject } from '@angular/core';
import { AnalyticsService } from './analytics.service';

/**
 * Delegated click tracking: attach `data-cta-tracking="<label>"` to any link
 * (or its ancestor) and a click anywhere within it reports a `cta` event.
 */
@Directive()
export class CtaTrackingDirective {
  private readonly analytics = inject(AnalyticsService);

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(
      '[data-cta-tracking]',
    );

    if (!target) {
      return;
    }

    const label = target.getAttribute('data-cta-tracking') ?? '';
    const url = target instanceof HTMLAnchorElement ? target.href : '';

    this.analytics.trackEvent('cta', { label, url });
  }
}
