import { TestBed } from '@angular/core/testing';
import { TurnstileService } from './turnstile.service';
import { TURNSTILE_SITE_KEY } from './chat.config';

describe('TurnstileService', () => {
  const render = vi.fn((_el: HTMLElement, opts: { callback: (token: string) => void }) => {
    queueMicrotask(() => opts.callback('tok'));
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
      queueMicrotask(() => opts.callback('tok2'));
    });

    expect(await service.token()).toBe('tok2');
    expect(render).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledWith('w1');
    expect(execute).toHaveBeenCalledTimes(2);
  });
});
