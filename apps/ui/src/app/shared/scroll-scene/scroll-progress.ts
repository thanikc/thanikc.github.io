import { Signal, signal } from '@angular/core';

export interface ScrollProgress {
  readonly value: Signal<number>;
  destroy(): void;
}

/**
 * Progress (0–1) through an element's own scroll range: 0 while its top sits
 * at the viewport top, 1 once the page has scrolled past its full height
 * minus one viewport. A caller pins its visible content with CSS `position:
 * sticky` inside this element and gives the element itself the extra height
 * that defines how much scrolling the pinned content spans. `onChange` hears
 * each new value, and only changes.
 *
 * Native `scroll`/`resize` + rAF throttling — no scroll-linked library.
 */
export function scrollProgress(
  wrapper: HTMLElement,
  onChange?: (value: number) => void,
): ScrollProgress {
  const value = signal(0);
  let ticking = false;
  let last: number | undefined;

  const measure = (): void => {
    ticking = false;
    const rect = wrapper.getBoundingClientRect();
    const range = rect.height - window.innerHeight;
    const next = range > 0 ? Math.min(1, Math.max(0, -rect.top / range)) : 0;
    value.set(next);
    if (next !== last) {
      last = next;
      onChange?.(next);
    }
  };

  const onScrollOrResize = (): void => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(measure);
  };

  measure();
  window.addEventListener('scroll', onScrollOrResize, { passive: true });
  window.addEventListener('resize', onScrollOrResize, { passive: true });

  return {
    value,
    destroy(): void {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    },
  };
}
