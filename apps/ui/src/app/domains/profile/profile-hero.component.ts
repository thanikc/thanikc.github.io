import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { EMAIL_LINK, LINKEDIN_LINK } from '../../shared/contact/contact-links';
import { HeroSceneComponent } from './hero-scene.component';
import { ProfileAskLingComponent } from './profile-ask-ling.component';

/**
 * Who Thanik is and what he builds, in one sentence, then two ways to go deeper:
 * the Email/LinkedIn CTAs, and the Ask AI Ling pitch (folded in here from its
 * own boxed card: headline and CTA share one section, never a separate card below).
 *
 * Full-bleed dark opening section: `ScrollSceneComponent` is only
 * referenced inside the `@defer` block below, so Angular code-splits it (and three.js)
 * into a lazy chunk kept out of the initial bundle and the prerendered/SSR HTML.
 */
@Component({
  selector: 'app-profile-hero',
  imports: [MatButtonModule, HeroSceneComponent, ProfileAskLingComponent],
  templateUrl: './profile-hero.component.html',
  styleUrl: './profile-hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileHeroComponent {
  readonly askLingPrompts = input.required<readonly string[]>();
  /** Two starters: contact stays the clear first action; the panel lists the rest. */
  protected readonly heroPrompts = computed(() => this.askLingPrompts().slice(0, 2));

  protected readonly title = $localize`:Job title above the name in the hero@@hero.title:Senior Full-Stack Engineer`;
  protected readonly positioning = $localize`:One-sentence positioning statement in the hero@@hero.positioning:I build Angular and Spring Boot systems for German online banking — a shared platform used by many banks, not just a single app. AI is a big part of how I work, but not an excuse to compromise on engineering quality. I'm as curious about how AI is changing the way we build serious software as I am about what I can build with it.`;
  protected readonly email = EMAIL_LINK;
  protected readonly linkedIn = LINKEDIN_LINK;
}
