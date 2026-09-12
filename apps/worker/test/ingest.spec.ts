import { describe, expect, it, vi } from 'vitest';
import { chunk, ingest } from '../src/ingest';

function fakeEnv(upsert = vi.fn().mockResolvedValue({ mutationId: '1' })) {
  const run = vi.fn().mockResolvedValue({ data: [[0.1]] });
  const env = { AI: { run }, VECTORIZE: { upsert } } as unknown as Env;
  return { env, upsert };
}

describe('ingest', () => {
  it('stores each neighboring chunk alongside a chunk so a boundary split does not lose context', async () => {
    const { env, upsert } = fakeEnv();
    const text = `${'a'.repeat(900)}\n${'b'.repeat(900)}`;
    const expectedChunks = chunk(text);

    await ingest('doc', text, {}, env);

    const vectors = upsert.mock.calls[0]?.[0];
    expect(vectors.length).toBe(expectedChunks.length);
    expect(vectors.length).toBeGreaterThan(1);

    vectors.forEach((vector: { metadata: Record<string, unknown> }, i: number) => {
      expect(vector.metadata.chunkIndex).toBe(i);
      expect(vector.metadata.totalChunks).toBe(expectedChunks.length);
      expect(vector.metadata.prevChunk).toBe(i > 0 ? expectedChunks[i - 1] : undefined);
      expect(vector.metadata.nextChunk).toBe(
        i < expectedChunks.length - 1 ? expectedChunks[i + 1] : undefined,
      );
    });
  });

  it('omits neighbor metadata for a single-chunk document', async () => {
    const { env, upsert } = fakeEnv();

    await ingest('doc', 'short text', {}, env);

    const [vector] = upsert.mock.calls[0]?.[0];
    expect(vector.metadata.prevChunk).toBeUndefined();
    expect(vector.metadata.nextChunk).toBeUndefined();
    expect(vector.metadata.chunkIndex).toBe(0);
    expect(vector.metadata.totalChunks).toBe(1);
  });
});
