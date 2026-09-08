import { describe, expect, it, vi } from 'vitest';
import { buildMessages, retrieve } from '../src/rag';

function fakeEnv(overrides: Partial<Env> = {}): Env {
  return {
    EMBEDDING_MODEL: '@cf/baai/bge-base-en-v1.5',
    ...overrides,
  } as unknown as Env;
}

describe('buildMessages', () => {
  it('grounds the system prompt in retrieved context and puts the question last', () => {
    const messages = buildMessages('What did Thanik build?', [
      { text: 'Built an interactive retirement calculator in Angular.', score: 0.9 },
    ]);

    expect(messages[0]?.role).toBe('system');
    expect(messages[0]?.content).toContain('retirement calculator');
    expect(messages.at(-1)).toEqual({ role: 'user', content: 'What did Thanik build?' });
  });

  it('keeps prior history between the system prompt and the new question', () => {
    const history = [
      { role: 'user' as const, content: 'hi' },
      { role: 'assistant' as const, content: 'hello' },
    ];
    const messages = buildMessages('and then?', [], history);

    expect(messages.map(m => m.role)).toEqual(['system', 'user', 'assistant', 'user']);
    expect(messages[0]?.content).toContain('no relevant context found');
  });
});

describe('retrieve', () => {
  it('embeds the query and maps Vectorize matches with text metadata', async () => {
    const run = vi.fn().mockResolvedValue({ data: [[0.1, 0.2, 0.3]] });
    const query = vi.fn().mockResolvedValue({
      matches: [
        { score: 0.82, metadata: { text: 'chunk one' } },
        { score: 0.41, metadata: {} },
        { score: 0.2, metadata: { text: 'chunk two' } },
      ],
    });
    const env = fakeEnv({ AI: { run }, VECTORIZE: { query } } as unknown as Partial<Env>);

    const chunks = await retrieve('question', env, 3);

    expect(run).toHaveBeenCalledWith('@cf/baai/bge-base-en-v1.5', { text: ['question'] });
    expect(query).toHaveBeenCalledWith([0.1, 0.2, 0.3], { topK: 3, returnMetadata: 'all' });
    expect(chunks).toEqual([
      { text: 'chunk one', score: 0.82 },
      { text: 'chunk two', score: 0.2 },
    ]);
  });
});
