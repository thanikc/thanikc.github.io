import { embed, vectorize } from './rag';

/**
 * Splits text into overlapping character windows on paragraph/whitespace boundaries.
 * Fixed-size splitting can still separate an idea from context it depends on (e.g. a
 * long paragraph cut mid-sentence). `ingest` mitigates this by storing each chunk's
 * neighbors in metadata so `retrieve` can stitch them back in on a match.
 */
export function chunk(text: string, size = 800, overlap = 100): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (normalized.length <= size) {
    return normalized ? [normalized] : [];
  }

  const chunks: string[] = [];
  let start = 0;
  while (start < normalized.length) {
    let end = Math.min(start + size, normalized.length);
    if (end < normalized.length) {
      const boundary = normalized.lastIndexOf('\n', end);
      if (boundary > start + overlap) {
        end = boundary;
      }
    }
    chunks.push(normalized.slice(start, end).trim());
    if (end >= normalized.length) {
      break;
    }
    start = end - overlap;
  }
  return chunks.filter(c => c !== '');
}

/** Chunks, embeds, and upserts a document into the Vectorize index. Returns the chunk count. */
export async function ingest(
  docId: string,
  text: string,
  metadata: Record<string, unknown>,
  env: Env,
): Promise<number> {
  const chunks = chunk(text);
  if (chunks.length === 0) {
    return 0;
  }

  const vectors = await Promise.all(
    chunks.map(async (content, i) => ({
      id: `${docId}:${i}`,
      values: await embed(content, env),
      metadata: {
        ...metadata,
        docId,
        text: content,
        chunkIndex: i,
        totalChunks: chunks.length,
        ...(i > 0 && { prevChunk: chunks[i - 1] }),
        ...(i < chunks.length - 1 && { nextChunk: chunks[i + 1] }),
      },
    })),
  );

  await vectorize(env).upsert(vectors);
  return vectors.length;
}
