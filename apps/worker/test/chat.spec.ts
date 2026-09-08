import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChatError, generate } from '../src/chat/client';

const MODELS = { GROQ_MODEL: 'groq-m', GOOGLE_MODEL: 'google-m', OPENROUTER_MODEL: 'or-m' };

function env(overrides: Record<string, string> = {}): Env {
  return { ...MODELS, ...overrides } as unknown as Env;
}

function completion(content: string): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function stubFetch(...outcomes: Array<Response | Error>): ReturnType<typeof vi.fn> {
  const mock = vi.fn();
  for (const outcome of outcomes) {
    if (outcome instanceof Error) mock.mockRejectedValueOnce(outcome);
    else mock.mockResolvedValueOnce(outcome);
  }
  vi.stubGlobal('fetch', mock);
  return mock;
}

afterEach(() => vi.unstubAllGlobals());

const ASK: Parameters<typeof generate>[0] = [{ role: 'user', content: 'hi' }];

describe('generate', () => {
  it('uses Groq first when it succeeds', async () => {
    const fetchMock = stubFetch(completion('from groq'));

    const result = await generate(
      ASK,
      env({ GROQ_API_KEY: 'g', GOOGLE_AI_API_KEY: 'x', OPENROUTER_API_KEY: 'y' }),
    );

    expect(result).toEqual({ answer: 'from groq', provider: 'groq' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('api.groq.com');
  });

  it('falls back Groq -> Google -> OpenRouter on failures', async () => {
    const fetchMock = stubFetch(
      new Response('boom', { status: 500 }),
      new Error('network down'),
      completion('from openrouter'),
    );

    const result = await generate(
      ASK,
      env({ GROQ_API_KEY: 'g', GOOGLE_AI_API_KEY: 'x', OPENROUTER_API_KEY: 'y' }),
    );

    expect(result.provider).toBe('openrouter');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[2]?.[0])).toContain('openrouter.ai');
  });

  it('skips providers that have no API key', async () => {
    const fetchMock = stubFetch(completion('from google'));

    const result = await generate(ASK, env({ GOOGLE_AI_API_KEY: 'x' }));

    expect(result.provider).toBe('google');
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('generativelanguage.googleapis.com');
  });

  it('throws ChatError when every configured provider fails', async () => {
    stubFetch(
      new Response('a', { status: 500 }),
      new Response('b', { status: 429 }),
      new Response('c', { status: 503 }),
    );

    await expect(
      generate(ASK, env({ GROQ_API_KEY: 'g', GOOGLE_AI_API_KEY: 'x', OPENROUTER_API_KEY: 'y' })),
    ).rejects.toBeInstanceOf(ChatError);
  });

  it('throws ChatError when no provider is configured', async () => {
    await expect(generate(ASK, env())).rejects.toMatchObject({ name: 'ChatError' });
  });
});
