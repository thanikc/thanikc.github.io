import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface TechSkill {
  category: string;
  skills: string[];
  icon: string;
}

export interface SideProject {
  name: string;
  description: string;
  url: string;
  icon: string;
}

const SKILL_CATEGORIES: readonly TechSkill[] = [
  {
    category: 'Frontend Excellence',
    skills: ['Angular', 'TypeScript', 'RxJS', 'Signals', 'Tailwind CSS', 'Angular Material'],
    icon: 'code',
  },
  {
    category: 'Backend & Microservices',
    skills: ['Spring Boot', 'Java', 'REST APIs', 'Spring Security', 'Hibernate/JPA'],
    icon: 'dns',
  },
  {
    category: 'Cloud & DevOps',
    skills: ['OpenShift', 'Kubernetes', 'Docker', 'CI/CD Pipelines', 'Helm'],
    icon: 'cloud_queue',
  },
];

const SIDE_PROJECTS: readonly SideProject[] = [
  {
    name: 'CrashDash',
    description:
      'A dashboard gauging the risk of a market crash by tracking a range of macro and market indicators.',
    url: 'https://crashdash.singdee.de/',
    icon: 'trending_down',
  },
];

@Component({
  selector: 'app-profile',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  // Static presentation content: no reactivity needed.
  readonly title = 'Full-Stack Engineer';
  readonly subtitle = 'Enterprise Angular • Spring Boot • OpenShift Solutions';
  readonly skillCategories = SKILL_CATEGORIES;
  readonly sideProjects = SIDE_PROJECTS;
}
