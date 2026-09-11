import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AdBannerComponent } from '../ads/ad-banner.component';
import { AdBannerService } from '../ads/ad-banner.service';
import { ProfileHeroComponent } from './profile-hero.component';
import { ProfileProjectsComponent } from './profile-projects.component';
import { ProfileThemesComponent } from './profile-themes.component';
import { PROJECTS, WORK_THEMES } from './profile.content';

export interface Interest {
  name: string;
  description: string;
  icon: string;
}

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
    MatIconModule,
    AdBannerComponent,
    ProfileHeroComponent,
    ProfileThemesComponent,
    ProfileProjectsComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  private readonly adBanner = inject(AdBannerService);

  // Static presentation content: no reactivity needed.
  readonly workThemes = WORK_THEMES;
  readonly projects = PROJECTS;
  readonly interests = INTERESTS;
  readonly showBanner = computed(
    () => this.adBanner.showBanner() && this.adBanner.routeAllowsAds(),
  );
}
