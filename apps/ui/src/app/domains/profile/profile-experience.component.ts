import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SectionHeaderComponent } from './section-header.component';
import { AskLingLinkComponent } from '../chat/ask-ling-link.component';
import { ExperienceStat } from './profile.content';

/**
 * Concrete seniority and scale evidence — years, tenure, leadership, the team's AI
 * rules — so "large" and "senior" rest on specifics instead of adjectives.
 */
@Component({
  selector: 'app-profile-experience',
  imports: [SectionHeaderComponent, AskLingLinkComponent],
  templateUrl: './profile-experience.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileExperienceComponent {
  readonly stats = input.required<readonly ExperienceStat[]>();

  protected readonly headingId = 'experience-heading';
}
