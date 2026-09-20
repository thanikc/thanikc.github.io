import { afterEach, describe, expect, it, vi } from 'vitest';
import app from '../src/index';

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
    const [latency, topScore, failovers, answerLength] = point.doubles;
    expect(latency).toBeGreaterThanOrEqual(0);
    expect([topScore, failovers, answerLength]).toEqual([0.9, 1, 11]);
    expect(point.indexes).toEqual(['google']);
    expect(JSON.stringify(point)).not.toContain('secret question');
  });

  it('records a gate decline as refused', async () => {
    const writeDataPoint = vi.fn();

    await post(setup(0.1, { writeDataPoint }), { message: 'quicksort?' });

    const point = writeDataPoint.mock.calls[0]![0];
    expect(point.blobs.slice(0, 4)).toEqual(['none', 'en', 'none', 'refused']);
    expect(point.doubles.slice(1)).toEqual([0.1, 0, expect.any(Number)]);
  });

  it('records an exhausted provider chain as failed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('boom', { status: 500 })));
    const writeDataPoint = vi.fn();

    const res = await post(setup(0.9, { writeDataPoint }), { message: 'hi' });

    expect(res.status).toBe(502);
    const point = writeDataPoint.mock.calls[0]![0];
    expect(point.blobs.slice(0, 4)).toEqual(['none', 'en', 'none', 'failed']);
    expect(point.doubles.slice(1)).toEqual([0.9, 2, 0]);
  });

  it('still answers when the ANALYTICS binding is absent', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(completion('ok')));

    const res = await post(setup(0.9, undefined), { message: 'hi' });

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Request-Id')).toBeTruthy();
  });
});
