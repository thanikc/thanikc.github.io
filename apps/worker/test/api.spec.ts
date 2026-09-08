import { afterEach, describe, expect, it, vi } from 'vitest';
import app from '../src/index';

const VARS = {
  ALLOWED_ORIGIN: 'https://thanikc.github.io',
  EMBEDDING_MODEL: '@cf/baai/bge-base-en-v1.5',
  GROQ_MODEL: 'groq-m',
  GOOGLE_MODEL: 'google-m',
  OPENROUTER_MODEL: 'or-m',
};

function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  return app.request(
    `https://worker.test${path}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    },
    env,
  );
}

let env: Env;

afterEach(() => vi.unstubAllGlobals());

describe('POST /api/chat', () => {
  it('rejects a missing message with 400', async () => {
    env = { ...VARS } as unknown as Env;
    const res = await post('/api/chat', {});

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'message is required' });
  });

  it('runs retrieval + generation and returns answer with sources', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ choices: [{ message: { content: 'Thanik is an engineer.' } }] }),
          {
            status: 200,
          },
        ),
      ),
    );
    env = {
      ...VARS,
      GROQ_API_KEY: 'g',
      AI: { run: vi.fn().mockResolvedValue({ data: [[0.1, 0.2]] }) },
      VECTORIZE: {
        query: vi.fn().mockResolvedValue({
          matches: [{ score: 0.9, metadata: { text: 'Full-stack engineer.' } }],
        }),
      },
    } as unknown as Env;

    const res = await post('/api/chat', { message: 'who is thanik?' });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      answer: 'Thanik is an engineer.',
      provider: 'groq',
      sources: [{ text: 'Full-stack engineer.', score: 0.9 }],
    });
  });

  it('returns 502 when all providers fail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('no', { status: 500 })));
    env = {
      ...VARS,
      GROQ_API_KEY: 'g',
      AI: { run: vi.fn().mockResolvedValue({ data: [[0.1]] }) },
      VECTORIZE: { query: vi.fn().mockResolvedValue({ matches: [] }) },
    } as unknown as Env;

    const res = await post('/api/chat', { message: 'hi' });

    expect(res.status).toBe(502);
  });
});

describe('POST /api/ingest', () => {
  it('401s without the bearer token', async () => {
    env = { ...VARS, INGEST_TOKEN: 'secret' } as unknown as Env;
    const res = await post('/api/ingest', { id: 'a', text: 'hello' });

    expect(res.status).toBe(401);
  });

  it('400s on a bad body even with a valid token', async () => {
    env = { ...VARS, INGEST_TOKEN: 'secret' } as unknown as Env;
    const res = await post('/api/ingest', { id: 'a' }, { authorization: 'Bearer secret' });

    expect(res.status).toBe(400);
  });

  it('chunks, embeds and upserts with a valid token', async () => {
    const upsert = vi.fn().mockResolvedValue({ mutationId: '1' });
    env = {
      ...VARS,
      INGEST_TOKEN: 'secret',
      AI: { run: vi.fn().mockResolvedValue({ data: [[0.1, 0.2]] }) },
      VECTORIZE: { upsert },
    } as unknown as Env;

    const res = await post(
      '/api/ingest',
      { id: 'resume', text: 'Thanik is a full-stack engineer.' },
      { authorization: 'Bearer secret' },
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, chunks: 1 });
    expect(upsert).toHaveBeenCalledOnce();
  });
});
