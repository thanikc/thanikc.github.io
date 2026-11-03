import { afterEach, describe, expect, it, vi } from 'vitest';
import app from '../src/index';
import { disabledAnswer } from '../src/rag';

const VARS = {
  ALLOWED_ORIGIN: 'https://thanikc.github.io',
  EMBEDDING_MODEL: '@cf/baai/bge-m3',
  GROQ_MODEL: 'groq-m',
  GOOGLE_MODEL: 'google-m',
  OPENROUTER_MODEL: 'or-m',
};

const completion = (content: string) =>
  new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });

function setup(score: number, analytics: unknown, extra: Record<string, unknown> = {}) {
  return {
    ...VARS,
    GROQ_API_KEY: 'g',
    GOOGLE_AI_API_KEY: 'x',
    ANALYTICS: analytics,
    AI: { run: vi.fn().mockResolvedValue({ data: [[0.1]] }) },
    VECTORIZE: {
      query: vi
        .fn()
        .mockResolvedValue({ matches: [{ score, metadata: { text: 't', title: 'T' } }] }),
    },
    ...extra,
  } as unknown as Env;
}

const post = (env: Env, body: unknown) =>
  app.request(
    'https://worker.test/api/chat',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    },
    env,
    { waitUntil() {}, passThroughOnException() {} } as never,
  );

afterEach(() => vi.unstubAllGlobals());

describe('chat telemetry', () => {
  it('records one point per answered request, with failover depth and no question text', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(new Response('boom', { status: 500 }))
        .mockResolvedValueOnce(completion('Hello there')),
    );
    const writeDataPoint = vi.fn();

    const res = await post(setup(0.9, { writeDataPoint }), {
      message: 'secret question',
      locale: 'de',
    });

    expect(writeDataPoint).toHaveBeenCalledTimes(1);
    const point = writeDataPoint.mock.calls[0]![0];
    expect(point.blobs.slice(0, 4)).toEqual(['google', 'de', 'none', 'ok']);
    expect(point.blobs[4]).toBe(res.headers.get('X-Request-Id'));
    const [latency, topScore, failovers, answerLength, cacheEligible] = point.doubles;
    expect(latency).toBeGreaterThanOrEqual(0);
    expect([topScore, failovers, answerLength]).toEqual([0.9, 1, 11]);
    expect(cacheEligible).toBe(0); // 0.9 is under the cache margin
    expect(point.indexes).toEqual(['google']);
    expect(JSON.stringify(point)).not.toContain('secret question');
  });

  it('records a gate decline as refused', async () => {
    const writeDataPoint = vi.fn();

    await post(setup(0.1, { writeDataPoint }), { message: 'quicksort?' });

    const point = writeDataPoint.mock.calls[0]![0];
    expect(point.blobs.slice(0, 4)).toEqual(['none', 'en', 'none', 'refused']);
    expect(point.doubles.slice(1)).toEqual([0.1, 0, expect.any(Number), 0]);
  });

  it('records an exhausted provider chain as failed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('boom', { status: 500 })));
    const writeDataPoint = vi.fn();

    const res = await post(setup(0.9, { writeDataPoint }), { message: 'hi' });

    expect(res.status).toBe(502);
    const point = writeDataPoint.mock.calls[0]![0];
    expect(point.blobs.slice(0, 4)).toEqual(['none', 'en', 'none', 'failed']);
    expect(point.doubles.slice(1)).toEqual([0.9, 2, 0, 0]);
  });

  it('still answers when the ANALYTICS binding is absent', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(completion('ok')));

    const res = await post(setup(0.9, undefined), { message: 'hi' });

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Request-Id')).toBeTruthy();
  });

  it('flags an answer that was stored in the cache as cache-eligible', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(completion('Hello there')));
    const writeDataPoint = vi.fn();

    const AI = { run: vi.fn().mockResolvedValue({ data: [[0.1]], response: { safe: true } }) };

    await post(setup(0.99, { writeDataPoint }, { AI }), { message: 'hi' });

    expect(writeDataPoint.mock.calls[0]![0].doubles[4]).toBe(1);
  });

  it('records a gate rejection as forbidden', async () => {
    const writeDataPoint = vi.fn();
    const env = setup(0.9, { writeDataPoint }, { TURNSTILE_SECRET: 'ts', SESSION_SECRET: 's' });

    const res = await post(env, { message: 'hi' });

    expect(res.status).toBe(403);
    expect(writeDataPoint.mock.calls[0]![0].blobs.slice(0, 4)).toEqual([
      'none',
      'en',
      'none',
      'forbidden',
    ]);
  });
});

describe('kill switch', () => {
  it('answers 503 with a localized message and touches no binding', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const writeDataPoint = vi.fn();
    const env = setup(0.9, { writeDataPoint }, { CHAT_DISABLED: 'true' });

    const res = await post(env, { message: 'hi', locale: 'de' });

    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string; answer: string };
    expect(body.error).toBe('disabled');
    expect(body.answer).toContain('Thanik');
    expect(body.answer).toBe(disabledAnswer('de'));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(env.AI.run).not.toHaveBeenCalled();
    expect(env.VECTORIZE.query).not.toHaveBeenCalled();
    expect(writeDataPoint.mock.calls[0]![0].blobs.slice(0, 4)).toEqual([
      'none',
      'de',
      'none',
      'disabled',
    ]);
  });

  it.each([undefined, 'false', ''])('is off when CHAT_DISABLED is %j', async value => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(completion('ok')));

    const res = await post(setup(0.9, undefined, { CHAT_DISABLED: value }), { message: 'hi' });

    expect(res.status).toBe(200);
  });
});
