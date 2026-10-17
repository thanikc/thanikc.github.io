import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import {
  ScrollSceneComponent,
  ScrollSceneDef,
} from '../../shared/scroll-scene/scroll-scene.component';
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
 * One work theme's scene, behind its own component so the themes section can
 * `@defer` it: the scene definitions import three.js, which would otherwise land
 * in the page's eager chunk.
 */
@Component({
  selector: 'app-theme-scene',
  imports: [ScrollSceneComponent],
  host: { class: 'block h-full w-full' },
  template: `
    <app-scroll-scene
      [scene]="scene()"
      range="through"
      (progress)="progress.emit($event)"
      class="block h-full w-full"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeSceneComponent {
  readonly index = input.required<number>();
  readonly progress = output<number>();

  protected readonly scene = computed(() => THEME_SCENES[this.index() % THEME_SCENES.length]);
}
