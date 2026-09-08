import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export interface GtagWindow extends Window {
  dataLayer?: unknown[][];
  gtag?: (...args: unknown[]) => void;
}

export type ConsentState = 'granted' | 'denied';

export interface ConsentUpdate {
  analytics_storage: ConsentState;
  ad_storage: ConsentState;
  ad_user_data: ConsentState;
  ad_personalization: ConsentState;
}

function isGtagWindow(view: unknown): view is GtagWindow {
  return view !== null && typeof view === 'object' && 'document' in view && 'location' in view;
}

/**
 * Bootstrapping (dataLayer/gtag.js script tag) is done statically in
 * src/index.html so it is present in the prerendered HTML. This service only
 * forwards page views/events to the already-initialized `window.gtag`.
 */
@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private readonly document = inject(DOCUMENT);

  trackPageView(path: string): void {
    const view = this.getWindow();

    if (!view?.gtag) {
      return;
    }

    view.gtag('event', 'page_view', {
      page_title: this.document.title,
      page_path: path,
      page_location: view.location.origin + path,
    });
  }

  trackEvent(name: string, params?: Record<string, unknown>): void {
    const view = this.getWindow();

    if (!view?.gtag) {
      return;
    }

    view.gtag('event', name, params);
  }

  /** Forwards a Consent Mode v2 update to the gtag.js queued in index.html. */
  updateConsent(consent: ConsentUpdate): void {
    const view = this.getWindow();

    if (!view?.gtag) {
      return;
    }

    view.gtag('consent', 'update', consent);
  }

  private getWindow(): GtagWindow | undefined {
    const view = this.document.defaultView;

    if (!isGtagWindow(view)) {
      return undefined;
    }

    return view;
  }
}
