import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdBannerToggleComponent } from '../../domains/ads/ad-banner-toggle.component';
import { AdBannerService } from '../../domains/ads/ad-banner.service';
import { SOCIAL_LINKS } from '../contact/contact-links';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, AdBannerToggleComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  private readonly ads = inject(AdBannerService);

  readonly socialLinks = SOCIAL_LINKS;
  readonly adsEnabled = this.ads.adsEnabled;
}
