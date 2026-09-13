import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { LanguageSelectorComponent } from '../i18n/language-selector.component';

interface NavLink {
  readonly label: string;
  /** Id of the target on the home page: a section heading, or the footer. */
  readonly fragment: string;
}

const NAV_LINKS: readonly NavLink[] = [
  {
    label: $localize`:Header nav link to the "What I work on" section@@header.nav.work:Work`,
    fragment: 'work-heading',
  },
  {
    label: $localize`:Header nav link to the projects section@@header.nav.projects:Projects`,
    fragment: 'projects-heading',
  },
  {
    label: $localize`:Header nav link to the contact details in the footer@@header.nav.contact:Contact`,
    fragment: 'contact',
  },
];

@Component({
  selector: 'app-header',
  imports: [RouterLink, MatButtonModule, MatToolbarModule, LanguageSelectorComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  protected readonly navLinks = NAV_LINKS;
}
