import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
} from '@angular/core';

declare global {
  interface Window {
    /** Ad request queue created by the AdSense script loaded in index.html. */
    adsbygoogle?: Record<string, unknown>[];
  }
}

@Component({
  selector: 'app-ad-banner',
  templateUrl: './ad-banner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdBannerComponent {
  /**
   * Hides the banner without removing it: AdSense fills the `<ins>` element once,
   * and a destroyed slot is never refilled.
   */
  readonly visible = input(true);

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // Browser-only. The slot must have a laid-out, non-zero width before AdSense
    // is asked to fill it, otherwise it fails with "No slot size for availableWidth=0"
    // (e.g. the banner starts hidden, or layout hasn't settled on first paint yet).
    afterNextRender(() => this.requestAdWhenSized());
  }

  private requestAdWhenSized(): void {
    const ins = this.host.nativeElement.querySelector('ins.adsbygoogle');
    if (!(ins instanceof HTMLElement)) {
      return;
    }

    if (ins.offsetWidth > 0) {
      this.requestAd();
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) {
        observer.disconnect();
        this.requestAd();
      }
    });
    observer.observe(ins);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  private requestAd(): void {
    try {
      (window.adsbygoogle ??= []).push({});
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }
}
