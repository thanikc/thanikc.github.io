// jsdom (used by the vitest unit-test runner) has no ResizeObserver. Components
// that use it need a stub in every test environment, not just the specs that
// exercise them directly, since they also render inside other components' specs.
if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }

  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

// jsdom has no matchMedia either. Default to "no preference" so `prefers-reduced-motion`
// checks behave like a real browser without that setting; individual specs can still
// `vi.spyOn(window, 'matchMedia')` to simulate the opposite.
if (typeof window !== 'undefined' && typeof window.matchMedia === 'undefined') {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
