import { TestBed } from '@angular/core/testing';
import { TurnstileService } from './turnstile.service';
import { TURNSTILE_SITE_KEY } from './chat.config';

describe('TurnstileService', () => {
  const render = vi.fn((_el: HTMLElement, opts: Record<string, (token?: string) => void>) => {
    queueMicrotask(() => opts['callback']('tok'));
    return 'w1';
  });
  const execute = vi.fn();
  const reset = vi.fn();

  beforeEach(() => {
    render.mockClear();
    execute.mockClear();
    reset.mockClear();
    // With the API already present no script is injected, so nothing touches the network.
    (window as unknown as { turnstile: unknown }).turnstile = { render, execute, reset };
    TestBed.configureTestingModule({
      providers: [{ provide: TURNSTILE_SITE_KEY, useValue: 'site-key' }],
    });
  });

  afterEach(() => {
    delete (window as unknown as { turnstile?: unknown }).turnstile;
  });

  it('resolves the token of an invisible widget rendered with the configured site key', async () => {
    const token = await TestBed.inject(TurnstileService).token();

    expect(token).toBe('tok');
    expect(render).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        sitekey: 'site-key',
        execution: 'execute',
        appearance: 'interaction-only',
      }),
    );
    expect(execute).toHaveBeenCalledWith('w1');
  });

  it('renders once and resets then executes the widget for a later token', async () => {
    const service = TestBed.inject(TurnstileService);
    await service.token();
    reset.mockImplementation(() => {
      const opts = render.mock.calls[0][1];
      queueMicrotask(() => opts['callback']('tok2'));
    });

    expect(await service.token()).toBe('tok2');
    expect(render).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledWith('w1');
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it('rejects when Turnstile reports an error', async () => {
    render.mockImplementationOnce((_el, opts) => {
      queueMicrotask(() => opts['error-callback']());
      return 'w1';
    });

    await expect(TestBed.inject(TurnstileService).token()).rejects.toThrow('Turnstile failed');
  });

  it.each(['timeout-callback', 'expired-callback'] as const)('rejects on %s', async name => {
    render.mockImplementationOnce((_el, opts) => {
      queueMicrotask(() => opts[name]());
      return 'w1';
    });

    await expect(TestBed.inject(TurnstileService).token()).rejects.toThrow('Turnstile failed');
  });

  it('rejects when Turnstile never calls back', async () => {
    vi.useFakeTimers();
    try {
      render.mockImplementationOnce(() => 'w1');
      const result = TestBed.inject(TurnstileService).token();
      const assertion = expect(result).rejects.toThrow('Turnstile timed out');
      await vi.advanceTimersByTimeAsync(15_000);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });
});
