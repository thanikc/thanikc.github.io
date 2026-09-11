import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ThemeToggleComponent } from '../theme/theme-toggle.component';

interface NavLink {
  readonly label: string;
  /** Id of the target on the home page: a section heading, or the footer. */
  readonly fragment: string;
}

const NAV_LINKS: readonly NavLink[] = [
  { label: 'Work', fragment: 'work-heading' },
  { label: 'Projects', fragment: 'projects-heading' },
  { label: 'Contact', fragment: 'contact' },
];

@Component({
  selector: 'app-header',
  imports: [RouterLink, MatButtonModule, MatToolbarModule, ThemeToggleComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  protected readonly navLinks = NAV_LINKS;
}
