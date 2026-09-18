import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as THREE from 'three';
import {
  ScrollSceneComponent,
  ScrollSceneDef,
  WEBGL_RENDERER_FACTORY,
  edgeFade,
} from './scroll-scene.component';

describe('edgeFade', () => {
  it('is 0 at the very start and end of the range', () => {
    expect(edgeFade(0)).toBe(0);
    expect(edgeFade(1)).toBe(0);
  });

  it('is fully opaque through the middle of the range', () => {
    expect(edgeFade(0.5)).toBe(1);
    expect(edgeFade(0.15)).toBe(1);
    expect(edgeFade(0.85)).toBe(1);
  });

  it('ramps linearly within the margin at each edge', () => {
    expect(edgeFade(0.075)).toBeCloseTo(0.5);
    expect(edgeFade(0.925)).toBeCloseTo(0.5);
  });
});

function stubMatchMedia(matches: boolean): void {
  vi.spyOn(window, 'matchMedia').mockReturnValue({
    matches,
    media: '',
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  } as MediaQueryList);
}

describe('ScrollSceneComponent', () => {
  let rendererInstance: {
    render: ReturnType<typeof vi.fn>;
    dispose: ReturnType<typeof vi.fn>;
    setSize: ReturnType<typeof vi.fn>;
    setPixelRatio: ReturnType<typeof vi.fn>;
  };

  const stubScene: ScrollSceneDef = {
    build: () => new THREE.Object3D(),
    onProgress: vi.fn(),
  };

  beforeEach(async () => {
    rendererInstance = {
      render: vi.fn(),
      dispose: vi.fn(),
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
    };
    stubMatchMedia(false);

    await TestBed.configureTestingModule({
      imports: [ScrollSceneComponent],
      providers: [
        {
          provide: WEBGL_RENDERER_FACTORY,
          useValue: () => rendererInstance as unknown as THREE.WebGLRenderer,
        },
      ],
    }).compileComponents();
  });

  async function createFixture(): Promise<ComponentFixture<ScrollSceneComponent>> {
    const fixture = TestBed.createComponent(ScrollSceneComponent);
    fixture.componentRef.setInput('scene', stubScene);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('renders one static frame and never starts an rAF loop under reduced motion', async () => {
    stubMatchMedia(true);

    await createFixture();
    const callsAfterFirstFrame = rendererInstance.render.mock.calls.length;
    // A running rAF loop would have queued (and by now fired) another frame;
    // a one-shot static render leaves nothing queued to fire.
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

    expect(callsAfterFirstFrame).toBe(1);
    expect(rendererInstance.render).toHaveBeenCalledTimes(1);
  });

  it('disposes the renderer on destroy', async () => {
    const fixture = await createFixture();

    fixture.destroy();

    expect(rendererInstance.dispose).toHaveBeenCalled();
  });
});
