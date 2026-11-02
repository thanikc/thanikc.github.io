import { afterEach, describe, expect, it, vi } from 'vitest';
import app from '../src/index';
import { issueSession, verifySession, verifyTurnstile } from '../src/gate';

const VARS = {
  ALLOWED_ORIGIN: 'https://thanikc.github.io',
  EMBEDDING_MODEL: '@cf/baai/bge-m3',
  GROQ_MODEL: 'groq-m',
  GOOGLE_MODEL: 'google-m',
  OPENROUTER_MODEL: 'or-m',
};
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const siteverify = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

afterEach(() => vi.unstubAllGlobals());

describe('verifyTurnstile', () => {
  const env = { ...VARS, TURNSTILE_SECRET: 'ts' } as unknown as Env;

  it('posts secret, response and remoteip to siteverify and accepts our hostname', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(siteverify({ success: true, hostname: 'thanikc.github.io' }));
    vi.stubGlobal('fetch', fetchMock);

    expect(await verifyTurnstile('tok', '1.2.3.4', env)).toBe(true);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(SITEVERIFY);
    const form = init.body as FormData | URLSearchParams;
    expect(form.get('secret')).toBe('ts');
    expect(form.get('response')).toBe('tok');
    expect(form.get('remoteip')).toBe('1.2.3.4');
  });

  it('rejects success: false', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(siteverify({ success: false })));
    expect(await verifyTurnstile('tok', undefined, env)).toBe(false);
  });

  it('rejects a hostname that is not an allowed origin', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(siteverify({ success: true, hostname: 'evil.example' })),
    );
    expect(await verifyTurnstile('tok', undefined, env)).toBe(false);
  });

  it('rejects when siteverify is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')));
    expect(await verifyTurnstile('tok', undefined, env)).toBe(false);
  });
});

describe('sessions', () => {
  it('accepts a fresh session and rejects it once expired', async () => {
    const token = await issueSession('s', 0);
    expect(await verifySession(token, 's', 899)).toBe(true);
    expect(await verifySession(token, 's', 901)).toBe(false);
  });

  it('rejects another secret, a tampered expiry and garbage', async () => {
    const token = await issueSession('s', 0);
    const [, sig] = token.split('.');
    expect(await verifySession(token, 'other', 1)).toBe(false);
    expect(await verifySession(`9999999.${sig}`, 's', 1)).toBe(false);
    expect(await verifySession('garbage', 's', 1)).toBe(false);
    expect(await verifySession('1.%%%', 's', 0)).toBe(false);
    expect(await verifySession('', 's', 0)).toBe(false);
  });
});

describe('POST /api/chat gate', () => {
  const post = (env: Env, headers: Record<string, string> = {}) =>
    app.request(
      'https://worker.test/api/chat',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...headers },
        body: JSON.stringify({ message: 'who is thanik?' }),
      },
      env,
      { waitUntil() {}, passThroughOnException() {} } as never,
    );

  const gated = () => {
    const run = vi.fn().mockResolvedValue({ data: [[0.1]] });
    const limit = vi.fn().mockResolvedValue({ success: true });
    const env = {
      ...VARS,
      GROQ_API_KEY: 'g',
      TURNSTILE_SECRET: 'ts',
      SESSION_SECRET: 'sess',
      AI: { run },
      CHAT_LIMIT: { limit },
      VECTORIZE: {
        query: vi.fn().mockResolvedValue({ matches: [{ score: 0.9, metadata: { text: 'x' } }] }),
      },
    } as unknown as Env;
    return { env, run, limit };
  };
  const fetchWith = (verdict: unknown) =>
    vi
      .fn()
      .mockImplementation(async (url: string) =>
        url === SITEVERIFY
          ? siteverify(verdict)
          : new Response(JSON.stringify({ choices: [{ message: { content: 'Hi.' } }] })),
      );

  it('403s without a token or session, touching neither the model nor the limiter', async () => {
    const { env, run, limit } = gated();
    vi.stubGlobal('fetch', fetchWith({ success: true, hostname: 'thanikc.github.io' }));

    const res = await post(env);

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'verification required' });
    expect(run).not.toHaveBeenCalled();
    expect(limit).not.toHaveBeenCalled();
  });

  it('lets a valid Turnstile token through and hands back a session', async () => {
    const { env } = gated();
    vi.stubGlobal('fetch', fetchWith({ success: true, hostname: 'thanikc.github.io' }));

    const res = await post(env, { 'X-Turnstile-Token': 'tok' });

    expect(res.status).toBe(200);
    expect(await verifySession(res.headers.get('X-Chat-Session')!, 'sess')).toBe(true);
  });

  it('403s a failed Turnstile token', async () => {
    const { env } = gated();
    vi.stubGlobal('fetch', fetchWith({ success: false }));

    expect((await post(env, { 'X-Turnstile-Token': 'tok' })).status).toBe(403);
  });

  it('accepts a valid session without calling siteverify', async () => {
    const { env } = gated();
    const fetchMock = fetchWith({ success: false });
    vi.stubGlobal('fetch', fetchMock);

    const res = await post(env, { 'X-Chat-Session': await issueSession('sess') });

    expect(res.status).toBe(200);
    expect(fetchMock.mock.calls.some(([url]) => url === SITEVERIFY)).toBe(false);
  });

  it('403s an expired session with no Turnstile token', async () => {
    const { env } = gated();
    vi.stubGlobal('fetch', fetchWith({ success: false }));

    const res = await post(env, { 'X-Chat-Session': await issueSession('sess', 0) });

    expect(res.status).toBe(403);
  });

  it('is off unless both secrets are set', async () => {
    const { env } = gated();
    vi.stubGlobal('fetch', fetchWith({ success: false }));

    for (const missing of ['TURNSTILE_SECRET', 'SESSION_SECRET']) {
      const open = { ...env, [missing]: undefined } as unknown as Env;
      expect((await post(open)).status).toBe(200);
    }
  });
});
