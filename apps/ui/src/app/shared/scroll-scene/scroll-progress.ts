import { Signal, signal } from '@angular/core';

export interface ScrollProgress {
  readonly value: Signal<number>;
  destroy(): void;
}

/**
 * - `pinned`: 0 while the element's top sits at the viewport top, 1 once the page
 *   has scrolled past its full height minus one viewport — the span its sticky
 *   content stays pinned for.
 * - `through`: 0 as its top enters at the viewport bottom, 1 as its bottom leaves
 *   at the top — every moment any of it is on screen.
 */
export type ScrollRange = 'pinned' | 'through';

/**
 * Progress (0–1) through an element's own scroll range (see `ScrollRange`). A
 * caller pins its visible content with CSS `position: sticky` inside this element
 * and gives the element itself the extra height that defines how much scrolling
 * the pinned content spans. `onChange` hears each new value, and only changes.
 *
 * Native `scroll`/`resize` + rAF throttling — no scroll-linked library.
 */
export function scrollProgress(
  wrapper: HTMLElement,
  range: ScrollRange = 'pinned',
  onChange?: (value: number) => void,
): ScrollProgress {
  const value = signal(0);
  let ticking = false;
  let last: number | undefined;

  const measure = (): void => {
    ticking = false;
    const rect = wrapper.getBoundingClientRect();
    const viewport = window.innerHeight;
    const span = range === 'pinned' ? rect.height - viewport : rect.height + viewport;
    const travelled = range === 'pinned' ? -rect.top : viewport - rect.top;
    const next = span > 0 ? Math.min(1, Math.max(0, travelled / span)) : 0;
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
