import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  InjectionToken,
  afterNextRender,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import * as THREE from 'three';
import { scrollProgress } from './scroll-progress';

/**
 * Builds the renderer, behind DI rather than a bare `new THREE.WebGLRenderer`
 * call, so component specs can substitute a fake renderer via `TestBed`
 * instead of mocking the `three` module — jsdom's canvas has no real WebGL
 * context, and `vi.mock('three', ...)` fights this Angular test builder's
 * bundling/hoisting order once more than one spec file in the same run
 * imports from `three` (confirmed: works isolated, breaks alongside a second
 * consumer).
 */
export const WEBGL_RENDERER_FACTORY = new InjectionToken<
  (options: THREE.WebGLRendererParameters) => THREE.WebGLRenderer
>('WEBGL_RENDERER_FACTORY', {
  factory: () => options => new THREE.WebGLRenderer(options),
});

export interface ScrollSceneDef {
  /** Builds the scene's hero object once; called after the renderer exists. */
  build(renderer: THREE.WebGLRenderer): THREE.Object3D;
  /** Called every frame (or once, under reduced motion) with progress 0–1. */
  onProgress(t: number, object: THREE.Object3D): void;
}

/**
 * One shared low/high-fidelity switch: a `ScrollSceneDef` reads this itself
 * (from `build`) to size its own geometry/particle count/shadow quality —
 * mobile and low-core devices get a cheaper scene, not a disabled one.
 */
export function sceneFidelity(): 'low' | 'high' {
  const cores = navigator.hardwareConcurrency ?? 4;
  return cores <= 4 || window.innerWidth < 768 ? 'low' : 'high';
}

/**
 * Eases a scene's opacity in/out at the edges of its own section's scroll
 * range (0–1), so consecutive scenes read as handing off to each other —
 * "cross-fading as its section scrolls through" — without a shared canvas or a
 * second scroll listener: each `ScrollSceneDef.onProgress` applies this to its own `t`.
 */
export function edgeFade(t: number, margin = 0.15): number {
  if (t < margin) return t / margin;
  if (t > 1 - margin) return (1 - t) / margin;
  return 1;
}

/**
 * Canvas host for a scroll-driven three.js scene: sticky within its own
 * extended-height box (give the host element a tall CSS height — e.g.
 * `min-height: 300vh` — to set how much scroll the pinned scene spans),
 * scroll progress mapped to 0–1, paused off-screen, disposed on destroy.
 * Owns the renderer/camera/scene lifecycle; a `ScrollSceneDef` only supplies
 * the object and how it reacts to progress.
 */
@Component({
  selector: 'app-scroll-scene',
  template: `
    <div class="scroll-scene-pin sticky top-0 h-screen w-full overflow-hidden">
      <canvas #canvas class="block h-full w-full"></canvas>
    </div>
  `,
  styles: `
    :host {
      display: block;
      position: relative;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrollSceneComponent {
  readonly scene = input.required<ScrollSceneDef>();
  readonly progress = output<number>();

  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly createRenderer = inject(WEBGL_RENDERER_FACTORY);

  constructor() {
    afterNextRender(() => this.start());
  }

  private start(): void {
    const canvas = this.canvasRef().nativeElement;
    const host = this.elementRef.nativeElement;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const renderer = this.createRenderer({
      canvas,
      alpha: true,
      antialias: sceneFidelity() === 'high',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 5;
    const threeScene = new THREE.Scene();
    const object = this.scene().build(renderer);
    threeScene.add(object);

    const resize = (): void => {
      const { clientWidth: width, clientHeight: height } = canvas;
      renderer.setSize(width, height, false);
      camera.aspect = width / (height || 1);
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const progress = scrollProgress(host);

    const renderFrame = (): void => {
      const t = progress.value();
      this.scene().onProgress(t, object);
      this.progress.emit(t);
      renderer.render(threeScene, camera);
    };

    let frameId: number | undefined;
    const loop = (): void => {
      renderFrame();
      frameId = requestAnimationFrame(loop);
    };

    // Offscreen, the loop pauses instead of rendering unseen frames; it never
    // starts at all under reduced motion (one static frame is rendered below).
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      if (reducedMotion) return;
      if (entry.isIntersecting && frameId === undefined) {
        loop();
      } else if (!entry.isIntersecting && frameId !== undefined) {
        cancelAnimationFrame(frameId);
        frameId = undefined;
      }
    });
    visibilityObserver.observe(canvas);

    if (reducedMotion) {
      renderFrame();
    }

    this.destroyRef.onDestroy(() => {
      visibilityObserver.disconnect();
      if (frameId !== undefined) {
        cancelAnimationFrame(frameId);
      }
      window.removeEventListener('resize', resize);
      progress.destroy();
      renderer.dispose();
    });
  }
}
