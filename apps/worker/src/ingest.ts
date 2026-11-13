import { embed, vectorize } from './rag';

/**
 * Splits text into overlapping character windows on paragraph/whitespace boundaries.
 * Fixed-size splitting can still separate an idea from context it depends on (e.g. a
 * long paragraph cut mid-sentence). `ingest` mitigates this by storing each chunk's
 * neighbors in metadata so `search` can stitch them back in on a match.
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

/** Bump when chunking or labelling changes, so unchanged documents are embedded again. */
const CHUNKER_VERSION = 2;

/**
 * "Title — Section" for each chunk: the nearest Markdown heading above it. A chunk cut from
 * the middle of a section otherwise no longer says which project or employer it describes.
 */
function headings(text: string, chunks: string[], title: unknown): string[] {
  const normalized = text.replace(/\r\n/g, '\n');
  let from = 0;
  return chunks.map(content => {
    const at = normalized.indexOf(content, from);
    from = at + 1;
    // Up to the end of the chunk's first line, so a chunk opening on a heading uses its own.
    const lineEnd = normalized.indexOf('\n', at);
    const above = normalized.slice(0, lineEnd < 0 ? normalized.length : lineEnd);
    const section = [...above.matchAll(/^#{1,6} +(.+)$/gm)].at(-1)?.[1]?.trim();
    return [...new Set([title, section])].filter(part => typeof part === 'string').join(' — ');
  });
}

async function contentHash(text: string, metadata: Record<string, unknown>): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify([CHUNKER_VERSION, text, metadata]));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Chunks, embeds, and upserts a document into the Vectorize index. A document whose
 * text and metadata hash to what chunk 0 already holds is skipped before any embedding.
 * When a document shrinks, its leftover tail chunks are deleted so they stop matching.
 * ponytail: a document removed from content/ leaves its vectors behind (Vectorize can't
 * list by prefix); delete them by hand with `wrangler vectorize delete-vectors`.
 */
export async function ingest(
  docId: string,
  text: string,
  metadata: Record<string, unknown>,
  env: Env,
): Promise<{ chunks: number; skipped: boolean; hash: string }> {
  const hash = await contentHash(text, metadata);
  const chunks = chunk(text);
  if (chunks.length === 0) {
    return { chunks: 0, skipped: false, hash };
  }

  const [first] = await vectorize(env).getByIds([`${docId}:0`]);
  if (first?.metadata?.contentHash === hash) {
    return { chunks: 0, skipped: true, hash };
  }

  const labels = headings(text, chunks, metadata.title);
  const vectors = await Promise.all(
    chunks.map(async (content, i) => ({
      id: `${docId}:${i}`,
      values: await embed(labels[i] ? `${labels[i]}\n${content}` : content, env),
      metadata: {
        ...metadata,
        docId,
        contentHash: hash,
        text: content,
        ...(labels[i] && { heading: labels[i] }),
        chunkIndex: i,
        totalChunks: chunks.length,
        ...(i > 0 && { prevChunk: chunks[i - 1] }),
        ...(i < chunks.length - 1 && { nextChunk: chunks[i + 1] }),
      },
    })),
  );

  await vectorize(env).upsert(vectors);

  const oldTotal = Number(first?.metadata?.totalChunks) || 0;
  if (oldTotal > chunks.length) {
    const stale = Array.from(
      { length: oldTotal - chunks.length },
      (_, i) => `${docId}:${chunks.length + i}`,
    );
    await vectorize(env).deleteByIds(stale);
  }
  return { chunks: vectors.length, skipped: false, hash };
}
