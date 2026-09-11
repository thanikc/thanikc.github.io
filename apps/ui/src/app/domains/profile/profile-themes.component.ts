import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AskLingLinkComponent } from '../chat/ask-ling-link.component';
import { SectionHeaderComponent } from './section-header.component';
import { WorkTheme } from './profile.content';

/**
 * "What I work on": the kinds of problems Thanik solves, each with its stack in
 * context and a hook that hands the detail over to AI Ling.
 */
@Component({
  selector: 'app-profile-themes',
  imports: [AskLingLinkComponent, SectionHeaderComponent],
  templateUrl: './profile-themes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileThemesComponent {
  readonly themes = input.required<readonly WorkTheme[]>();

  protected readonly headingId = 'work-heading';
}
