import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SectionHeaderComponent } from './section-header.component';
import { Interest } from './profile.content';

/** Panel fills cycled across the row, so no two neighbours share one. */
const TONES = ['tone-accent', 'tone-dark', 'tone-light'] as const;

/**
 * "Beyond the Code": the personality that keeps the page from reading like a CV.
 * One full-bleed band of alternating-fill panels, each numbered — the same
 * reference family as the work-theme panels, at a quieter scale — and last.
 */
@Component({
  selector: 'app-profile-interests',
  imports: [MatIconModule, SectionHeaderComponent],
  templateUrl: './profile-interests.component.html',
  styleUrl: './profile-interests.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileInterestsComponent {
  readonly interests = input.required<readonly Interest[]>();

  protected readonly headingId = 'interests-heading';
  protected readonly toneFor = (index: number): string => TONES[index % TONES.length];
  protected readonly counterFor = (index: number): string =>
    String(index + 1).padStart(2, '0') + '.';
}
