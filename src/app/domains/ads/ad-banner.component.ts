import { afterNextRender, ChangeDetectionStrategy, Component, input } from '@angular/core';

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

  constructor() {
    // Browser-only: the slot must exist in the DOM before AdSense is asked to fill it.
    afterNextRender(() => {
      try {
        (window.adsbygoogle ??= []).push({});
      } catch (error) {
        console.error('AdSense error:', error);
      }
    });
  }
}
