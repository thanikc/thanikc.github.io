import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AdBannerComponent } from '../ads/ad-banner.component';
import { AdBannerService } from '../ads/ad-banner.service';
import { CHAT_SUGGESTIONS } from '../chat/chat.constants';
import { ProfileAskLingComponent } from './profile-ask-ling.component';
import { ProfileExperienceComponent } from './profile-experience.component';
import { ProfileHeroComponent } from './profile-hero.component';
import { ProfileInterestsComponent } from './profile-interests.component';
import { ProfilePrinciplesComponent } from './profile-principles.component';
import { ProfileProjectsComponent } from './profile-projects.component';
import { ProfileThemesComponent } from './profile-themes.component';
import { ProfileToolboxComponent } from './profile-toolbox.component';
import {
  EXPERIENCE_STATS,
  INTERESTS,
  PRINCIPLES,
  PROJECTS,
  TOOLBOX,
  WORK_THEMES,
} from './profile.content';

/**
 * The profile page, in the brief's hierarchy: who (hero), explore by asking (AI Ling),
 * judgment (principles), experience (seniority evidence), what kind of work (themes),
 * evidence (projects), the stack (toolbox), then personality.
 */
@Component({
  selector: 'app-profile',
  imports: [
    AdBannerComponent,
    ProfileHeroComponent,
    ProfileAskLingComponent,
    ProfilePrinciplesComponent,
    ProfileExperienceComponent,
    ProfileThemesComponent,
    ProfileProjectsComponent,
    ProfileToolboxComponent,
    ProfileInterestsComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  private readonly adBanner = inject(AdBannerService);

  // Static presentation content: no reactivity needed.
  readonly askLingPrompts = CHAT_SUGGESTIONS;
  readonly workThemes = WORK_THEMES;
  readonly projects = PROJECTS;
  readonly principles = PRINCIPLES;
  readonly experienceStats = EXPERIENCE_STATS;
  readonly toolbox = TOOLBOX;
  readonly interests = INTERESTS;
  readonly showBanner = computed(
    () => this.adBanner.showBanner() && this.adBanner.routeAllowsAds(),
  );
}
