import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AdBannerComponent } from '../ads/ad-banner.component';
import { AdBannerService } from '../ads/ad-banner.service';
import { ProfileHeroComponent } from './profile-hero.component';
import { ProfileThemesComponent } from './profile-themes.component';
import { WORK_THEMES } from './profile.content';

export interface SideProject {
  name: string;
  description: string;
  url: string;
  icon: string;
  /** External projects open in a new tab; in-app routes navigate via the router. */
  external: boolean;
  /** Shown on the card when the project is not openly usable, e.g. behind a sign-in. */
  access?: string;
}

export interface Interest {
  name: string;
  description: string;
  icon: string;
}

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
    access: 'Private — sign-in required',
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

const INTERESTS: readonly Interest[] = [
  {
    name: 'Swimming',
    description:
      'Swim regularly for endurance, not speed — always chasing a cleaner stroke and a longer set.',
    icon: 'pool',
  },
  {
    name: 'Bouldering',
    description:
      'Picked it up after a recurring spinal injury ended my BJJ training — still physical, still problem-solving, and it keeps the core strong.',
    icon: 'terrain',
  },
  {
    name: 'Chess',
    description: 'The occasional game when I want a slower kind of puzzle.',
    icon: 'extension',
  },
  {
    name: 'Learning Mandarin',
    description: 'Recently started on Mandarin Chinese, on top of German, English and Thai.',
    icon: 'translate',
  },
];

@Component({
  selector: 'app-profile',
  imports: [
    RouterLink,
    MatIconModule,
    AdBannerComponent,
    ProfileHeroComponent,
    ProfileThemesComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  private readonly adBanner = inject(AdBannerService);

  // Static presentation content: no reactivity needed.
  readonly workThemes = WORK_THEMES;
  readonly sideProjects = SIDE_PROJECTS;
  readonly interests = INTERESTS;
  readonly showBanner = computed(
    () => this.adBanner.showBanner() && this.adBanner.routeAllowsAds(),
  );
}
