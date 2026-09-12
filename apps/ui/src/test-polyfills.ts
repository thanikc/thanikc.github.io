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
