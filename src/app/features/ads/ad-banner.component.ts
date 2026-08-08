import { Component, AfterViewInit } from '@angular/core';

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
export class AdBannerComponent implements AfterViewInit {
  ngAfterViewInit(): void {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }
}
