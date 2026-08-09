import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/header/header.component';
import { AdBannerComponent } from './domains/ads/ad-banner.component';
import { AdBannerService } from './domains/ads/ad-banner.service';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, AdBannerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  readonly ads = inject(AdBannerService);
}
