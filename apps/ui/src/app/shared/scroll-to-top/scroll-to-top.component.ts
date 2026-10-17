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
 * The host is a zero-height `position: sticky` anchor placed after the footer
 * (mirroring `ChatShellComponent`): the button floats at the viewport bottom, and
 * hides while the footer is in view rather than sitting on it.
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
        i18n-aria-label="Accessible name of the back-to-top button@@shell.scrollToTop"
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

    /* Not on phones: stacked over the launcher it covered card actions and method
     * text, and a phone has its own way back up (tap the status bar, flick). */
    @media (max-width: 639.98px) {
      :host {
        display: none;
      }
    }

    /* Material's mini-FAB is 40px, short of the 44px touch-target minimum. Stacked
     * on the right above the chat launcher (centred over its 6rem, inset 1rem). */
    .scroll-to-top-fab {
      position: absolute;
      right: 2.5rem;
      bottom: 7.75rem;
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
  private readonly footerInView = signal(false);

  readonly visible = computed(
    () => this.scrolledPastThreshold() && !this.footerInView() && !this.cookieConsent.showBanner(),
  );

  constructor() {
    afterNextRender(() => {
      const onScroll = (): void => {
        this.scrolledPastThreshold.set(window.scrollY > SCROLL_VISIBILITY_THRESHOLD_PX);
      };

      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      this.destroyRef.onDestroy(() => window.removeEventListener('scroll', onScroll));

      const footer = document.getElementById('contact');
      if (footer) {
        const observer = new IntersectionObserver(([entry]) =>
          this.onFooterVisibilityChange(entry.isIntersecting),
        );
        observer.observe(footer);
        this.destroyRef.onDestroy(() => observer.disconnect());
      }
    });
  }

  protected onFooterVisibilityChange(visible: boolean): void {
    this.footerInView.set(visible);
  }

  scrollToTop(): void {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, left: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    // The button unmounts near the top, which would drop keyboard focus to <body>;
    // continue from the start of the main content instead (preventScroll: the
    // smooth scroll above is already on its way there).
    document.getElementById('main-content')?.focus({ preventScroll: true });
  }
}
