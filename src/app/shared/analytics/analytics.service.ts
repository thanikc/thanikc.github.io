import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { GA_MEASUREMENT_ID } from './ga-measurement-id.token';

export interface GtagWindow extends Window {
  dataLayer?: unknown[][];
  gtag?: (...args: unknown[]) => void;
}

function isGtagWindow(view: unknown): view is GtagWindow {
  return view !== null && typeof view === 'object' && 'document' in view;
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private readonly document = inject(DOCUMENT);
  private readonly measurementId = inject(GA_MEASUREMENT_ID);

  initialize(): void {
    const view = this.getWindow();

    if (!view) {
      return;
    }

    const dataLayer = (view.dataLayer = view.dataLayer || []);
    const gtag = (view.gtag = (...args: unknown[]) => {
      dataLayer.push(args);
    });

    gtag('js', new Date());
    gtag('config', this.measurementId);

    this.appendScript();
  }

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

  private getWindow(): GtagWindow | undefined {
    const view = this.document.defaultView;

    if (!isGtagWindow(view)) {
      return undefined;
    }

    return view;
  }

  private appendScript(): void {
    const { head } = this.document;

    const existing = head.querySelector<HTMLScriptElement>(
      'script[src*="googletagmanager.com/gtag/js"]',
    );

    if (existing) {
      return;
    }

    const script = this.document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    head.appendChild(script);
  }
}
