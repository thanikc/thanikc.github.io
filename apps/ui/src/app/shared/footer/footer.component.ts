import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AdBannerToggleComponent } from '../../domains/ads/ad-banner-toggle.component';
import { AdBannerService } from '../../domains/ads/ad-banner.service';
import { BrandMarkComponent } from '../brand-mark/brand-mark.component';
import { contactLink, SOCIAL_LINKS } from '../contact/contact-links';
import { NAV_LINKS } from '../nav-links';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, AdBannerToggleComponent, BrandMarkComponent, MatButtonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  private readonly ads = inject(AdBannerService);

  // The footer is the #contact target, so a Contact link here would only scroll to itself.
  readonly navLinks = NAV_LINKS.filter(link => link.fragment !== 'contact');
  readonly socialLinks = SOCIAL_LINKS;
  readonly email = contactLink('Email');
  readonly adsEnabled = this.ads.adsEnabled;
}
