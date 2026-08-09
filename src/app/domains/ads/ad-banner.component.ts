import { Component, input, afterNextRender } from '@angular/core';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

@Component({
  selector: 'app-ad-banner',
  standalone: true,
  templateUrl: './ad-banner.component.html',
})
export class AdBannerComponent {
  visible = input(true);

  private initialized = false;

  constructor() {
    afterNextRender(() => {
      this.initialized = true;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error('AdSense error:', e);
      }
    });
  }
}
