import { Component, ChangeDetectionStrategy, inject, effect, untracked } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { AdBannerComponent } from './domains/ads/ad-banner.component';
import { AdBannerService } from './domains/ads/ad-banner.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

interface AnalyticsWindow extends Window {
  gtag?: (
    command: string,
    eventName: string,
    params: {
      page_title: string;
      page_path: string;
      page_location: string;
    },
  ) => void;
}

function isAnalyticsWindow(view: unknown): view is AnalyticsWindow {
  return view !== null && typeof view === 'object' && 'document' in view;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, AdBannerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  readonly ads = inject(AdBannerService);

  private readonly router = inject(Router);

  private readonly document = inject(DOCUMENT);

  private readonly navigationEnd = toSignal(
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)),
  );

  constructor() {
    effect(() => {
      const e = this.navigationEnd();
      if (e) {
        untracked(() => {
          const view = this.document.defaultView;
          if (isAnalyticsWindow(view) && view.gtag) {
            view.gtag('event', 'page_view', {
              page_title: this.document.title,
              page_path: e.urlAfterRedirects, // Captures final path after any guards/redirects
              page_location: view.location.origin + e.urlAfterRedirects,
            });
          }
        });
      }
    });
  }
}
