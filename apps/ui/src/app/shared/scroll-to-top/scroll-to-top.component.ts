import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CookieConsentService } from '../cookie-consent/cookie-consent.service';

/** Below this scroll offset there's nothing to jump past, so the button stays hidden. */
const SCROLL_VISIBILITY_THRESHOLD_PX = 400;

/**
 * Floating "back to top" button, shown once the page has scrolled past
 * `SCROLL_VISIBILITY_THRESHOLD_PX`. Stays hidden while the cookie consent banner is
 * showing rather than trying to sit above it — the banner spans the full width of the
 * same corner, and its height varies with viewport width and content.
 *
 * The host is a zero-height `position: sticky` anchor placed just above the footer
 * (mirroring `ChatShellComponent`): the button floats near the viewport bottom while
 * scrolling, then comes to rest above the footer instead of covering it once the page
 * bottom scrolls into view.
 */
@Component({
  selector: 'app-scroll-to-top',
  imports: [MatButtonModule, MatIconModule],
  template: `
    @if (visible()) {
      <button
        mat-mini-fab
        type="button"
        class="scroll-to-top-fab"
        aria-label="Scroll to top"
        (click)="scrollToTop()"
      >
        <mat-icon aria-hidden="true">arrow_upward</mat-icon>
      </button>
    }
  `,
  styles: `
    :host {
      display: block;
      position: sticky;
      bottom: 0;
      z-index: 40;
    }

    // Material's mini-FAB is 40px, short of the 44px touch-target minimum.
    .scroll-to-top-fab {
      position: absolute;
      left: 50%;
      bottom: 1rem;
      transform: translateX(-50%);
      width: 3rem;
      height: 3rem;
      border: 1px solid var(--mat-sys-outline);
      background-color: var(--app-surface-raised);
      color: var(--mat-sys-on-surface);
      animation: fade-in 200ms ease-out;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrollToTopComponent {
  private readonly cookieConsent = inject(CookieConsentService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly scrolledPastThreshold = signal(false);

  readonly visible = computed(
    () => this.scrolledPastThreshold() && !this.cookieConsent.showBanner(),
  );

  constructor() {
    afterNextRender(() => {
      const onScroll = (): void => {
        this.scrolledPastThreshold.set(window.scrollY > SCROLL_VISIBILITY_THRESHOLD_PX);
      };

      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      this.destroyRef.onDestroy(() => window.removeEventListener('scroll', onScroll));
    });
  }

  scrollToTop(): void {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, left: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  }
}
