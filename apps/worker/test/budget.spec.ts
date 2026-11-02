import { env as testEnv } from 'cloudflare:test';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import createBudget from '../migrations/0004_generation_budget.sql?raw';
import createTable from '../migrations/0001_answer_cache.sql?raw';
import dropQuestion from '../migrations/0002_drop_cached_question.sql?raw';
import dropEpoch from '../migrations/0003_drop_epoch.sql?raw';
import app from '../src/index';
import { takeGeneration } from '../src/budget';
import { busyAnswer } from '../src/rag';

const VARS = {
  ALLOWED_ORIGIN: 'https://thanikc.github.io',
  EMBEDDING_MODEL: '@cf/baai/bge-m3',
  GROQ_MODEL: 'groq-m',
  GOOGLE_MODEL: 'google-m',
  OPENROUTER_MODEL: 'or-m',
};

const MATCH = { score: 0.9, metadata: { text: 'Full-stack engineer.', title: 'Summary' } };

let db: D1Database;
let env: Env;
let fetchMock: ReturnType<typeof vi.fn>;

const withLimit = (DAILY_GENERATION_LIMIT?: number) => ({ ...env, DAILY_GENERATION_LIMIT }) as Env;

async function post(body: unknown, overrides: Partial<Record<string, unknown>> = {}) {
  const pending: Promise<unknown>[] = [];
  const res = await app.request(
    'https://worker.test/api/chat',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    },
    { ...env, ...overrides } as Env,
    { waitUntil: (p: Promise<unknown>) => pending.push(p), passThroughOnException() {} } as never,
  );
  await Promise.all(pending);
  return res;
}

beforeEach(async () => {
  db = (testEnv as unknown as { CACHE_DB: D1Database }).CACHE_DB;
  await db.prepare('DROP TABLE IF EXISTS answer_cache').run();
  await db.prepare('DROP TABLE IF EXISTS generation_budget').run();
  for (const statement of `${createTable};${dropQuestion};${dropEpoch};${createBudget}`
    .split(';')
    .filter(s => s.trim())) {
    await db.prepare(statement).run();
  }
  fetchMock = vi
    .fn()
    .mockImplementation(
      async () =>
        new Response(
          JSON.stringify({ choices: [{ message: { content: 'Thanik is an engineer.' } }] }),
          { status: 200 },
        ),
    );
  vi.stubGlobal('fetch', fetchMock);
  env = {
    ...VARS,
    GROQ_API_KEY: 'g',
    CACHE_DB: db,
    AI: { run: vi.fn().mockResolvedValue({ data: [[1, 0, 0]], response: { safe: true } }) },
    VECTORIZE: { query: vi.fn().mockResolvedValue({ matches: [MATCH] }) },
  } as unknown as Env;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('takeGeneration', () => {
  it('allows up to the limit, then refuses', async () => {
    const e = withLimit(2);
    expect([await takeGeneration(e), await takeGeneration(e), await takeGeneration(e)]).toEqual([
      true,
      true,
      false,
    ]);
  });

  it('counts each UTC day separately', async () => {
    const e = withLimit(1);
    expect(await takeGeneration(e, new Date('2026-11-02T23:59:00Z'))).toBe(true);
    expect(await takeGeneration(e, new Date('2026-11-03T00:00:00Z'))).toBe(true);
  });

  it('allows when the var is absent', async () => {
    expect(await takeGeneration(withLimit(undefined))).toBe(true);
  });

  it('allows without a CACHE_DB binding', async () => {
    expect(await takeGeneration({ ...withLimit(0), CACHE_DB: undefined } as unknown as Env)).toBe(
      true,
    );
  });

  it('allows when D1 throws, and warns', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const broken = {
      ...withLimit(0),
      CACHE_DB: {
        prepare: () => {
          throw new Error('d1 down');
        },
      },
    } as unknown as Env;
    expect(await takeGeneration(broken)).toBe(true);
    expect(warn).toHaveBeenCalled();
  });
});

describe('busyAnswer', () => {
  it('returns de/th copy for those locales and en otherwise', () => {
    expect(busyAnswer('de')).toMatch(/^Heute wurden/);
    expect(busyAnswer('th')).toMatch(/^วันนี้/);
    expect(busyAnswer('fr')).toBe(busyAnswer('en'));
    expect(busyAnswer('en')).toMatch(/^I've had a lot of questions today/);
  });
});

describe('POST /api/chat budget', () => {
  it('answers busy, without a provider call, once the budget is spent', async () => {
    const writeDataPoint = vi.fn();
    const res = await post(
      { message: 'Who is Thanik?', locale: 'en' },
      { DAILY_GENERATION_LIMIT: 0, ANALYTICS: { writeDataPoint } },
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      answer: busyAnswer('en'),
      provider: 'none',
      sources: [],
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(writeDataPoint.mock.calls[0]![0].blobs[3]).toBe('budget');
  });

  it('does not spend budget on a cache hit', async () => {
    const first = await post({ message: 'Who is Thanik?' }, { DAILY_GENERATION_LIMIT: 1 });
    expect(first.status).toBe(200);
    const second = await post({ message: 'Who is Thanik?' }, { DAILY_GENERATION_LIMIT: 1 });
    expect(((await second.json()) as { cached?: string }).cached).toBe('exact');
  });
});
