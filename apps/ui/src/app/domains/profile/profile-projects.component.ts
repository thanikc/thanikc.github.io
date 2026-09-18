import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ProjectCardComponent } from './project-card.component';
import { Project } from './profile.content';

/** "Things I've built": one row, featured projects leading, the small tools after. */
@Component({
  selector: 'app-profile-projects',
  imports: [ProjectCardComponent],
  templateUrl: './profile-projects.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileProjectsComponent {
  readonly projects = input.required<readonly Project[]>();

  private readonly featured = computed(() => this.projects().filter(p => p.featured));
  private readonly more = computed(() => this.projects().filter(p => !p.featured));
  protected readonly ordered = computed(() => [...this.featured(), ...this.more()]);
  protected readonly headingId = 'projects-heading';
}
