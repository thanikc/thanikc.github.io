import { ChangeDetectionStrategy, Component, HostListener, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BrandMarkComponent } from '../brand-mark/brand-mark.component';
import { LanguageSelectorComponent } from '../i18n/language-selector.component';
import { NAV_LINKS } from '../nav-links';

// Below this, the fixed header still floats over the full-bleed dark hero and
// stays transparent; past it, it needs a solid backdrop to read over content.
const SCROLL_SOLID_THRESHOLD = 24;

@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    BrandMarkComponent,
    MatButtonModule,
    MatToolbarModule,
    LanguageSelectorComponent,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  protected readonly navLinks = NAV_LINKS;
  protected readonly scrolled = signal(false);

  @HostListener('window:scroll')
  protected onWindowScroll(): void {
    this.scrolled.set(window.scrollY > SCROLL_SOLID_THRESHOLD);
  }
}
