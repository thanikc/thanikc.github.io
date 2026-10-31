import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export interface GtagWindow extends Window {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
}

export type ConsentState = 'granted' | 'denied';

export interface ConsentUpdate {
  analytics_storage: ConsentState;
  ad_storage: ConsentState;
  ad_user_data: ConsentState;
  ad_personalization: ConsentState;
}

const MEASUREMENT_ID = 'G-HSC8QB0EQL';

/**
 * Google Analytics, which is not on the page until the visitor accepts: nothing reaches
 * Google before `enable()`, and until then every other method here is a no-op.
 */
@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private readonly document = inject(DOCUMENT);

  /** Adds gtag.js to the page. Only call this for a visitor who has accepted. */
  enable(): void {
    const view = this.window;
    if (!view || view.gtag) return;

    view.dataLayer ??= [];
    // gtag.js only reads queued calls in this exact form: an `arguments` object, not an array.
    view.gtag = function () {
      view.dataLayer!.push(arguments);
    };
    view.gtag('js', new Date());
    // Page views are reported by `trackPageView`; the automatic one would count them twice.
    view.gtag('config', MEASUREMENT_ID, { send_page_view: false });

    const script = this.document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    this.document.head.append(script);
  }

  /** Reports the address in the bar, so each language build counts as its own page. */
  trackPageView(): void {
    const location = this.window?.location;

    this.gtag('event', 'page_view', {
      page_title: this.document.title,
      page_path: location?.pathname,
      page_location: location?.href,
    });
  }

  trackEvent(name: string, params?: Record<string, unknown>): void {
    this.gtag('event', name, params);
  }

  /** A withdrawal also switches off a gtag.js already on the page, which can't be unloaded. */
  updateConsent(consent: ConsentUpdate): void {
    const view = this.window as (GtagWindow & Record<string, unknown>) | null;
    if (view) view[`ga-disable-${MEASUREMENT_ID}`] = consent.analytics_storage === 'denied';
    this.gtag('consent', 'update', consent);
  }

  private get window(): GtagWindow | null {
    return this.document.defaultView as GtagWindow | null;
  }

  private gtag(...args: unknown[]): void {
    this.window?.gtag?.(...args);
  }
}
