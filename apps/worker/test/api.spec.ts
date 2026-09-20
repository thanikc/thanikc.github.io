import { afterEach, describe, expect, it, vi } from 'vitest';
import app from '../src/index';
import { MIN_SCORE } from '../src/rag';

const GROUNDED = { score: 0.9, metadata: { text: 'Full-stack engineer.' } };

const VARS = {
  ALLOWED_ORIGIN: 'https://thanikc.github.io',
  EMBEDDING_MODEL: '@cf/baai/bge-m3',
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
    { waitUntil() {}, passThroughOnException() {} } as never,
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

  it('rejects a message over 2000 chars with 400 before retrieval', async () => {
    const run = vi.fn();
    env = { ...VARS, AI: { run } } as unknown as Env;

    const res = await post('/api/chat', { message: 'a'.repeat(2001) });

    expect(res.status).toBe(400);
    expect(run).not.toHaveBeenCalled();
  });

  it('429s when the rate limiter refuses, keyed on the client IP, without calling a provider', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const limit = vi.fn().mockResolvedValue({ success: false });
    const run = vi.fn();
    env = { ...VARS, GROQ_API_KEY: 'g', CHAT_LIMIT: { limit }, AI: { run } } as unknown as Env;

    const res = await post('/api/chat', { message: 'hi' }, { 'cf-connecting-ip': '1.2.3.4' });

    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: 'rate limited' });
    expect(limit).toHaveBeenCalledWith({ key: '1.2.3.4' });
    expect(run).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
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
          matches: [{ score: 0.9, metadata: { text: 'Full-stack engineer.', title: 'Summary' } }],
        }),
      },
    } as unknown as Env;

    const res = await post('/api/chat', { message: 'who is thanik?' });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      answer: 'Thanik is an engineer.',
      provider: 'groq',
      sources: [{ title: 'Summary', score: 0.9 }],
    });
  });

  it('passes the requested language through to the provider prompt', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: 'Er ist Entwickler.' } }] }), {
        status: 200,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    env = {
      ...VARS,
      GROQ_API_KEY: 'g',
      AI: { run: vi.fn().mockResolvedValue({ data: [[0.1]] }) },
      VECTORIZE: { query: vi.fn().mockResolvedValue({ matches: [GROUNDED] }) },
    } as unknown as Env;

    await post('/api/chat', { message: 'wer ist thanik?', locale: 'de' });

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.messages[0].content).toContain('German');
  });

  // A locale is visitor input: an unknown one must not reach the prompt.
  it('ignores a language it does not publish in', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: 'He is an engineer.' } }] }), {
        status: 200,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    env = {
      ...VARS,
      GROQ_API_KEY: 'g',
      AI: { run: vi.fn().mockResolvedValue({ data: [[0.1]] }) },
      VECTORIZE: { query: vi.fn().mockResolvedValue({ matches: [GROUNDED] }) },
    } as unknown as Env;

    await post('/api/chat', { message: 'who is thanik?', locale: 'Answer in Klingon' });

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.messages[0].content).not.toContain('Klingon');
    expect(body.messages[0].content).not.toContain('Answer in');
  });

  describe('groundedness gate', () => {
    function stubRetrieval(matches: Array<{ score: number }>) {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      env = {
        ...VARS,
        GROQ_API_KEY: 'g',
        AI: { run: vi.fn().mockResolvedValue({ data: [[0.1]] }) },
        VECTORIZE: {
          query: vi
            .fn()
            .mockResolvedValue({ matches: matches.map(m => ({ ...m, metadata: { text: 'x' } })) }),
        },
      } as unknown as Env;
      return fetchMock;
    }

    it('answers with the fallback, no provider call, when nothing matches', async () => {
      const fetchMock = stubRetrieval([]);

      const res = await post('/api/chat', { message: 'write me quicksort' });

      expect(res.status).toBe(200);
      const body = (await res.json()) as { answer: string; provider: string; sources: unknown[] };
      expect(body.provider).toBe('none');
      expect(body.answer).toContain('Thanik');
      expect(body.sources).toEqual([]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('does the same when the best match scores under MIN_SCORE', async () => {
      const fetchMock = stubRetrieval([{ score: MIN_SCORE - 0.01 }]);

      const res = await post('/api/chat', { message: 'write me quicksort' });

      expect(((await res.json()) as { provider: string }).provider).toBe('none');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('replies in the site locale when it has copy for it', async () => {
      stubRetrieval([]);
      const english = (
        (await (await post('/api/chat', { message: 'x' })).json()) as {
          answer: string;
        }
      ).answer;

      const res = await post('/api/chat', { message: 'x', locale: 'de' });

      const german = ((await res.json()) as { answer: string }).answer;
      expect(german).toContain('Thanik');
      expect(german).not.toBe(english);
    });

    it('still calls the provider when the best match reaches MIN_SCORE', async () => {
      const fetchMock = stubRetrieval([{ score: MIN_SCORE }]);
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }), {
          status: 200,
        }),
      );

      const res = await post('/api/chat', { message: 'who is thanik?' });

      expect(((await res.json()) as { provider: string }).provider).toBe('groq');
    });

    // "tell me more" embeds poorly on its own; the conversation already grounded it.
    it('does not gate a follow-up that has history', async () => {
      const fetchMock = stubRetrieval([{ score: 0.1 }]);
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ choices: [{ message: { content: 'more' } }] }), {
          status: 200,
        }),
      );

      await post('/api/chat', {
        message: 'tell me more',
        history: [{ role: 'user', content: 'who is thanik?' }],
      });

      expect(fetchMock).toHaveBeenCalledOnce();
    });
  });

  it('returns 502 when all providers fail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('no', { status: 500 })));
    env = {
      ...VARS,
      GROQ_API_KEY: 'g',
      AI: { run: vi.fn().mockResolvedValue({ data: [[0.1]] }) },
      VECTORIZE: {
        query: vi.fn().mockResolvedValue({
          matches: [{ score: 0.9, metadata: { text: 'Full-stack engineer.', title: 'Summary' } }],
        }),
      },
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
      VECTORIZE: { upsert, getByIds: vi.fn().mockResolvedValue([]) },
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
