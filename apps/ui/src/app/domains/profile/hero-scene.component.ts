import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ScrollSceneComponent } from '../../shared/scroll-scene/scroll-scene.component';
import { heroScene } from './hero-scene.def';

/**
 * The hero's scene behind its own component so the hero can `@defer` it: the scene
 * definition imports three.js, and a template-only reference to it from the hero
 * would pull three.js into the page's eager chunk.
 */
@Component({
  selector: 'app-hero-scene',
  imports: [ScrollSceneComponent],
  host: { class: 'block h-full w-full' },
  template: `<app-scroll-scene [scene]="scene" class="block h-full w-full" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroSceneComponent {
  protected readonly scene = heroScene;
}
