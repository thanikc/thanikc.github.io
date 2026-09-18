import { scrollProgress } from './scroll-progress';

/** A wrapper whose top/height are fixed, as if scrolled to a given position. */
function mockWrapper(top: number, height: number): HTMLElement {
  const el = document.createElement('div');
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    top,
    height,
    bottom: top + height,
    left: 0,
    right: 0,
    width: 0,
    x: 0,
    y: top,
    toJSON: () => ({}),
  } as DOMRect);
  return el;
}

async function flushRaf(): Promise<void> {
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
}

describe('scrollProgress', () => {
  const VIEWPORT_HEIGHT = 800;
  const WRAPPER_HEIGHT = 800 * 3; // 1600px of scrollable range past one viewport

  beforeEach(() => {
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: VIEWPORT_HEIGHT,
    });
  });

  it('is 0 while the wrapper top still sits at the viewport top', () => {
    const wrapper = mockWrapper(0, WRAPPER_HEIGHT);

    const { value, destroy } = scrollProgress(wrapper);

    expect(value()).toBe(0);
    destroy();
  });

  it('is proportional partway through the range', async () => {
    // Range is height - viewport = 1600; scrolled 800 of that, i.e. halfway.
    const wrapper = mockWrapper(-800, WRAPPER_HEIGHT);
    const { value, destroy } = scrollProgress(wrapper);

    window.dispatchEvent(new Event('scroll'));
    await flushRaf();

    expect(value()).toBeCloseTo(0.5);
    destroy();
  });

  it('reaches 1 once scrolled through the full range', async () => {
    const wrapper = mockWrapper(-1600, WRAPPER_HEIGHT);
    const { value, destroy } = scrollProgress(wrapper);

    window.dispatchEvent(new Event('scroll'));
    await flushRaf();

    expect(value()).toBe(1);
    destroy();
  });

  it('clamps to [0, 1] outside the range', async () => {
    const overscrolled = mockWrapper(-3000, WRAPPER_HEIGHT);
    const over = scrollProgress(overscrolled);
    window.dispatchEvent(new Event('scroll'));
    await flushRaf();
    expect(over.value()).toBe(1);
    over.destroy();

    const beforeStart = mockWrapper(200, WRAPPER_HEIGHT);
    const before = scrollProgress(beforeStart);
    window.dispatchEvent(new Event('scroll'));
    await flushRaf();
    expect(before.value()).toBe(0);
    before.destroy();
  });

  it('is 0 for a wrapper no taller than the viewport (no scroll range)', () => {
    const wrapper = mockWrapper(0, VIEWPORT_HEIGHT);

    const { value, destroy } = scrollProgress(wrapper);

    expect(value()).toBe(0);
    destroy();
  });

  it('stops updating after destroy', async () => {
    const wrapper = mockWrapper(0, WRAPPER_HEIGHT);
    const { value, destroy } = scrollProgress(wrapper);
    destroy();

    vi.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue({
      top: -1600,
      height: WRAPPER_HEIGHT,
      bottom: -1600 + WRAPPER_HEIGHT,
      left: 0,
      right: 0,
      width: 0,
      x: 0,
      y: -1600,
      toJSON: () => ({}),
    } as DOMRect);
    window.dispatchEvent(new Event('scroll'));
    await flushRaf();

    expect(value()).toBe(0);
  });
});
