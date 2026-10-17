import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { CookieConsentService } from './cookie-consent.service';

@Component({
  selector: 'app-cookie-consent-banner',
  imports: [MatButtonModule, RouterLink],
  templateUrl: './cookie-consent-banner.component.html',
  styleUrl: './cookie-consent-banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CookieConsentBannerComponent {
  private readonly consent = inject(CookieConsentService);

  readonly visible = this.consent.showBanner;

  private readonly banner = viewChild<ElementRef<HTMLElement>>('banner');

  constructor() {
    // Reports the banner's height (it wraps differently per width and language), so
    // the chat launcher can sit above it instead of hiding or covering its buttons.
    let observer: ResizeObserver | undefined;
    effect(() => {
      observer?.disconnect();
      const el = this.banner()?.nativeElement;
      if (!el || typeof ResizeObserver === 'undefined') {
        this.consent.bannerHeight.set(0);
        return;
      }
      observer = new ResizeObserver(() => this.consent.bannerHeight.set(el.offsetHeight));
      observer.observe(el);
    });
    inject(DestroyRef).onDestroy(() => observer?.disconnect());
  }

  accept(): void {
    this.consent.accept();
  }

  reject(): void {
    this.consent.reject();
  }
}
