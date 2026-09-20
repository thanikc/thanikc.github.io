import { env as testEnv } from 'cloudflare:test';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import migration from '../migrations/0001_answer_cache.sql?raw';
import app from '../src/index';

const VARS = {
  ALLOWED_ORIGIN: 'https://thanikc.github.io',
  EMBEDDING_MODEL: '@cf/baai/bge-m3',
  GROQ_MODEL: 'groq-m',
  GOOGLE_MODEL: 'google-m',
  OPENROUTER_MODEL: 'or-m',
  CACHE_EPOCH: '1',
};

const MATCH = { score: 0.9, metadata: { text: 'Full-stack engineer.', title: 'Summary' } };

let env: Env;
let fetchMock: ReturnType<typeof vi.fn>;
let embedding: number[];

function post(body: unknown, overrides: Partial<Record<string, unknown>> = {}) {
  return app.request(
    'https://worker.test/api/chat',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    },
    { ...env, ...overrides } as Env,
    { waitUntil: (p: Promise<unknown>) => pending.push(p), passThroughOnException() {} } as never,
  );
}

const pending: Promise<unknown>[] = [];
const settle = async () => {
  await Promise.all(pending.splice(0));
};

const json = async (res: Response) =>
  (await res.json()) as { answer: string; provider: string; cached?: string; sources: unknown[] };

beforeEach(async () => {
  const db = (testEnv as unknown as { CACHE_DB: D1Database }).CACHE_DB;
  await db.prepare('DROP TABLE IF EXISTS answer_cache').run();
  for (const statement of migration.split(';').filter(s => s.trim())) {
    await db.prepare(statement).run();
  }

  embedding = [1, 0, 0];
  fetchMock = vi.fn().mockImplementation(
    async () =>
      new Response(
        JSON.stringify({ choices: [{ message: { content: 'Thanik is an engineer.' } }] }),
        {
          status: 200,
        },
      ),
  );
  vi.stubGlobal('fetch', fetchMock);
  env = {
    ...VARS,
    GROQ_API_KEY: 'g',
    CACHE_DB: db,
    AI: { run: vi.fn().mockImplementation(async () => ({ data: [embedding] })) },
    VECTORIZE: { query: vi.fn().mockResolvedValue({ matches: [MATCH] }) },
  } as unknown as Env;
});

afterEach(() => vi.unstubAllGlobals());

describe('answer cache: exact tier', () => {
  it('serves a repeated question from D1 without embedding, retrieval or a provider call', async () => {
    const first = await json(await post({ message: 'Who is Thanik?' }));
    await settle();
    const second = await json(await post({ message: 'Who is Thanik?' }));

    expect(first.cached).toBeUndefined();
    expect(second).toEqual({ ...first, cached: 'exact' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((env.AI as unknown as { run: unknown }).run).toHaveBeenCalledTimes(1);
  });

  it('treats case and surrounding whitespace as the same question', async () => {
    await post({ message: 'Who is Thanik?' });
    await settle();

    const res = await json(await post({ message: '  who is THANIK?  ' }));

    expect(res.cached).toBe('exact');
  });

  it('keeps locales apart', async () => {
    await post({ message: 'Who is Thanik?', locale: 'en' });
    await settle();

    const res = await json(await post({ message: 'Who is Thanik?', locale: 'de' }));

    expect(res.cached).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not cache a decline', async () => {
    (env.VECTORIZE as unknown as { query: ReturnType<typeof vi.fn> }).query.mockResolvedValue({
      matches: [],
    });
    await post({ message: 'quicksort?' });
    await settle();

    const count = await (env as unknown as { CACHE_DB: D1Database }).CACHE_DB.prepare(
      'SELECT COUNT(*) AS n FROM answer_cache',
    ).first<{ n: number }>();

    expect(count?.n).toBe(0);
  });

  it('does not cache or serve a follow-up that has history', async () => {
    const history = [{ role: 'user', content: 'hi' }];
    await post({ message: 'Tell me more', history });
    await settle();

    const again = await json(await post({ message: 'Tell me more', history }));

    expect(again.cached).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('ignores rows written under another CACHE_EPOCH', async () => {
    await post({ message: 'Who is Thanik?' });
    await settle();

    const res = await json(await post({ message: 'Who is Thanik?' }, { CACHE_EPOCH: '2' }));

    expect(res.cached).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('answers normally when D1 throws', async () => {
    const broken = {
      prepare: () => {
        throw new Error('D1 down');
      },
    };

    const res = await post({ message: 'Who is Thanik?' }, { CACHE_DB: broken });
    await settle();

    expect(res.status).toBe(200);
    expect((await json(res)).answer).toBe('Thanik is an engineer.');
  });

  it('works without a CACHE_DB binding', async () => {
    const res = await post({ message: 'Who is Thanik?' }, { CACHE_DB: undefined });

    expect(res.status).toBe(200);
  });
});

describe('answer cache: semantic tier', () => {
  const askWith = async (
    message: string,
    vector: number[],
    extra: Record<string, unknown> = {},
  ) => {
    embedding = vector;
    return json(await post({ message, ...extra }));
  };

  it('serves a paraphrase whose embedding is close enough, reusing the one embedding', async () => {
    const first = await askWith('Who is Thanik?', [1, 0, 0]);
    await settle();
    const vectorize = (env.VECTORIZE as unknown as { query: ReturnType<typeof vi.fn> }).query;

    const second = await askWith('Tell me about Thanik', [0.99, 0.1, 0]);

    expect(second).toEqual({ ...first, cached: 'semantic' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(vectorize).toHaveBeenCalledTimes(1);
    expect((env.AI as unknown as { run: unknown }).run).toHaveBeenCalledTimes(2);
  });

  it('embeds a cache miss only once', async () => {
    await askWith('Who is Thanik?', [1, 0, 0]);

    expect((env.AI as unknown as { run: unknown }).run).toHaveBeenCalledTimes(1);
  });

  it('does not serve a question that is only loosely similar', async () => {
    await askWith('Who is Thanik?', [1, 0, 0]);
    await settle();

    const res = await askWith('What is a monad?', [0.9, 0.44, 0]);

    expect(res.cached).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not serve across locales', async () => {
    await askWith('Who is Thanik?', [1, 0, 0]);
    await settle();

    const res = await askWith('Wer ist Thanik?', [1, 0, 0], { locale: 'de' });

    expect(res.cached).toBeUndefined();
  });

  it('does not serve rows from another epoch', async () => {
    await askWith('Who is Thanik?', [1, 0, 0]);
    await settle();
    embedding = [1, 0, 0];

    const res = await json(await post({ message: 'Tell me about Thanik' }, { CACHE_EPOCH: '2' }));

    expect(res.cached).toBeUndefined();
  });
});
