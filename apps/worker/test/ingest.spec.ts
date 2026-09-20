import { describe, expect, it, vi } from 'vitest';
import { chunk, ingest } from '../src/ingest';

function fakeEnv(stored: unknown[] = []) {
  const upsert = vi.fn().mockResolvedValue({ mutationId: '1' });
  const getByIds = vi.fn().mockResolvedValue(stored);
  const deleteByIds = vi.fn().mockResolvedValue({ mutationId: '2' });
  const run = vi.fn().mockResolvedValue({ data: [[0.1]] });
  const env = {
    AI: { run },
    VECTORIZE: { upsert, getByIds, deleteByIds },
  } as unknown as Env;
  return { env, upsert, getByIds, deleteByIds, run };
}

/** What the index holds for `doc:0` after `ingest` upserted it. */
async function storedChunkZero(text: string, metadata: Record<string, unknown> = {}) {
  const { env, upsert } = fakeEnv();
  await ingest('doc', text, metadata, env);
  return [upsert.mock.calls[0]?.[0][0]];
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

  it('skips embedding when the stored content hash matches', async () => {
    const stored = await storedChunkZero('unchanged text');
    const { env, upsert, run } = fakeEnv(stored);

    const result = await ingest('doc', 'unchanged text', {}, env);

    expect(result).toEqual({ chunks: 0, skipped: true });
    expect(run).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it('re-embeds when the text changed', async () => {
    const stored = await storedChunkZero('old text');
    const { env, upsert } = fakeEnv(stored);

    expect(await ingest('doc', 'new text', {}, env)).toEqual({ chunks: 1, skipped: false });
    expect(upsert).toHaveBeenCalledOnce();
  });

  it('re-embeds when only the metadata changed', async () => {
    const stored = await storedChunkZero('same text', { title: 'Old' });
    const { env, upsert } = fakeEnv(stored);

    await ingest('doc', 'same text', { title: 'New' }, env);

    expect(upsert).toHaveBeenCalledOnce();
  });

  it('deletes tail chunks left over when a document shrinks', async () => {
    const long = `${'a'.repeat(900)}\n${'b'.repeat(900)}`;
    const stored = await storedChunkZero(long);
    const oldTotal = chunk(long).length;
    const { env, deleteByIds } = fakeEnv(stored);

    await ingest('doc', 'now short', {}, env);

    const expected = Array.from({ length: oldTotal - 1 }, (_, i) => `doc:${i + 1}`);
    expect(deleteByIds).toHaveBeenCalledWith(expected);
  });

  it('deletes nothing when the chunk count does not shrink', async () => {
    const { env, deleteByIds } = fakeEnv();

    await ingest('doc', 'short text', {}, env);

    expect(deleteByIds).not.toHaveBeenCalled();
  });
});
