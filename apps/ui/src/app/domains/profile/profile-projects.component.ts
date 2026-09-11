import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ProjectCardComponent } from './project-card.component';
import { SectionHeaderComponent } from './section-header.component';
import { Project } from './profile.content';

/** "Things I've built": featured projects get the first row, the small tools follow. */
@Component({
  selector: 'app-profile-projects',
  imports: [ProjectCardComponent, SectionHeaderComponent],
  templateUrl: './profile-projects.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileProjectsComponent {
  readonly projects = input.required<readonly Project[]>();

  protected readonly featured = computed(() => this.projects().filter(p => p.featured));
  protected readonly more = computed(() => this.projects().filter(p => !p.featured));
  protected readonly headingId = 'projects-heading';
}
