import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChatError, generate, MAX_TOKENS } from '../src/chat/client';

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

    expect(result).toEqual({
      answer: 'from groq',
      provider: 'groq',
      failovers: 0,
      truncated: false,
    });
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

    expect(result).toMatchObject({ provider: 'openrouter', failovers: 2 });
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

  it('caps completion length', async () => {
    const fetchMock = stubFetch(completion('ok'));
    await generate(ASK, env({ GROQ_API_KEY: 'g' }));
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1].body).max_tokens).toBe(MAX_TOKENS);
  });

  it('flags a completion cut at the token cap', async () => {
    const reply = (finish_reason: string) =>
      new Response(JSON.stringify({ choices: [{ message: { content: 'x' }, finish_reason }] }), {
        status: 200,
      });
    stubFetch(reply('length'), reply('stop'));
    const e = env({ GROQ_API_KEY: 'g' });
    expect((await generate(ASK, e)).truncated).toBe(true);
    expect((await generate(ASK, e)).truncated).toBe(false);
  });

  it('does not fail over once the deadline has passed', async () => {
    const fetchMock = stubFetch(new Error('boom'), completion('late'));
    const now = vi.spyOn(Date, 'now').mockReturnValueOnce(0).mockReturnValue(1_001);
    await expect(
      generate(ASK, env({ GROQ_API_KEY: 'g', GOOGLE_AI_API_KEY: 'x' }), 1_000),
    ).rejects.toBeInstanceOf(ChatError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    now.mockRestore();
  });
});
