import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BrandMarkComponent } from '../brand-mark/brand-mark.component';
import { EMAIL_LINK, SOCIAL_LINKS } from '../contact/contact-links';
import { NAV_LINKS } from '../nav-links';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, BrandMarkComponent, MatButtonModule, MatIconModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  // The footer is the #contact target, so a Contact link here would only scroll to itself.
  readonly navLinks = NAV_LINKS.filter(link => link.fragment !== 'contact');
  readonly socialLinks = SOCIAL_LINKS;
  readonly email = EMAIL_LINK;
}
