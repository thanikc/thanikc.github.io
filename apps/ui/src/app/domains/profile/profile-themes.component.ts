import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { AskLingLinkComponent } from '../chat/ask-ling-link.component';
import { SectionHeaderComponent } from './section-header.component';
import {
  ScrollSceneComponent,
  ScrollSceneDef,
} from '../../shared/scroll-scene/scroll-scene.component';
import { WorkTheme } from './profile.content';
import { aiScene } from './theme-scenes/ai-scene.def';
import { modernisingScene } from './theme-scenes/modernising-scene.def';
import { platformScene } from './theme-scenes/platform-scene.def';
import { servicesScene } from './theme-scenes/services-scene.def';

// One scene per WorkTheme, same order as profile.content.ts's WORK_THEMES.
const THEME_SCENES: readonly ScrollSceneDef[] = [
  platformScene,
  modernisingScene,
  servicesScene,
  aiScene,
];

/**
 * "What I work on" as numbered narrative sections: each theme becomes its own full-bleed dark, sticky
 * panel with its own scroll-driven scene, instead of a static card grid.
 */
@Component({
  selector: 'app-profile-themes',
  imports: [AskLingLinkComponent, SectionHeaderComponent, ScrollSceneComponent],
  templateUrl: './profile-themes.component.html',
  styleUrl: './profile-themes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileThemesComponent {
  readonly themes = input.required<readonly WorkTheme[]>();

  protected readonly headingId = 'work-heading';
  protected readonly sceneFor = (index: number): ScrollSceneDef =>
    THEME_SCENES[index % THEME_SCENES.length];
  protected readonly counterFor = (index: number): string =>
    String(index + 1).padStart(2, '0') + '.';

  private readonly progressByIndex = signal<readonly number[]>([]);

  // Sections are stacked in order and each scene's own progress clamps to
  // [0, 1] outside its own range, so the last one that's started (> 0) is
  // the active one — derived purely from the existing per-scene `progress`
  // outputs, no extra scroll listener.
  protected readonly activeIndex = computed(() => {
    const values = this.progressByIndex();
    let active = 0;
    for (let i = 0; i < values.length; i++) {
      if (values[i] > 0) active = i;
    }
    return active;
  });

  // Whether the panels block itself is in the viewport — an IntersectionObserver,
  // not derived from the per-scene progress signals: a theme whose `@defer`
  // never mounted (scrolled past too fast to trigger `on viewport`) would
  // otherwise leave its progress stuck at 0 forever, permanently blocking an
  // "every theme finished" check from ever passing again.
  protected readonly showProgress = signal(false);

  private readonly panelsRef = viewChild.required<ElementRef<HTMLElement>>('panels');
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      const observer = new IntersectionObserver(([entry]) =>
        this.onPanelsVisibilityChange(entry.isIntersecting),
      );
      observer.observe(this.panelsRef().nativeElement);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected onSceneProgress(index: number, value: number): void {
    this.progressByIndex.update(values => {
      const next =
        values.length === this.themes().length ? [...values] : this.themes().map(() => 0);
      next[index] = value;
      return next;
    });
  }

  protected onPanelsVisibilityChange(visible: boolean): void {
    this.showProgress.set(visible);
  }
}
