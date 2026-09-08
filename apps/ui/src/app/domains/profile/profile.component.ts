import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AdBannerComponent } from '../ads/ad-banner.component';
import { AdBannerService } from '../ads/ad-banner.service';

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
  /** External projects open in a new tab; in-app routes navigate via the router. */
  external: boolean;
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
    name: 'Retirement Calculator',
    description:
      'Projects the net worth and monthly contributions needed to hit your retirement number.',
    url: '/calculator',
    icon: 'calculate',
    external: false,
  },
  {
    name: 'CrashDash',
    description:
      'A dashboard gauging the risk of a market crash by tracking a range of macro and market indicators.',
    url: 'https://crashdash.singdee.de/',
    icon: 'trending_down',
    external: true,
  },
  {
    name: 'BJJ Quiz',
    description:
      'A fun quiz that guesses your Brazilian Jiu-Jitsu belt from your answers, then hits you with a lighthearted roast generated live by AI.',
    url: 'https://bjj-quiz.thanikc.workers.dev/',
    icon: 'sports_martial_arts',
    external: true,
  },
];

@Component({
  selector: 'app-profile',
  imports: [RouterLink, MatIconModule, AdBannerComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  private readonly adBanner = inject(AdBannerService);

  // Static presentation content: no reactivity needed.
  readonly title = 'Full-Stack Engineer';
  readonly subtitle = 'Enterprise Angular • Spring Boot • OpenShift Solutions';
  readonly intro =
    'I build enterprise web applications end to end: Angular front ends with Signals and standalone components, backed by Spring Boot microservices running on Kubernetes and OpenShift. AI assistants are part of my day-to-day workflow, from scaffolding tests to reviewing architecture decisions. This site is also my sandbox for trying out new patterns in production.';
  readonly skillCategories = SKILL_CATEGORIES;
  readonly sideProjects = SIDE_PROJECTS;
  readonly showBanner = computed(
    () => this.adBanner.showBanner() && this.adBanner.routeAllowsAds(),
  );
}
