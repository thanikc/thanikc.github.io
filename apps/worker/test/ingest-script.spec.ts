import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs ops script, no types
import { parseDoc } from '../scripts/ingest.mjs';

describe('parseDoc', () => {
  it('derives id and metadata from the file name', () => {
    const doc = parseDoc('experience.md', '# Experience\n\nSenior engineer at Acme.');

    expect(doc).toEqual({
      id: 'experience',
      text: '# Experience\n\nSenior engineer at Acme.',
      metadata: { section: 'experience', source: 'content/experience.md' },
    });
  });

  it('reads a frontmatter block into metadata and strips it from the text', () => {
    const raw = ['---', 'title: Work History', 'company: Acme', '---', '', 'Did things.'].join(
      '\n',
    );
    const doc = parseDoc('experience.md', raw);

    expect(doc.text).toBe('Did things.');
    expect(doc.metadata).toMatchObject({
      section: 'experience',
      title: 'Work History',
      company: 'Acme',
    });
  });

  it('lets frontmatter override the document id', () => {
    const doc = parseDoc('01-summary.md', '---\nid: summary\n---\nA summary.');

    expect(doc.id).toBe('summary');
  });

  it('trims surrounding whitespace from the body', () => {
    expect(parseDoc('a.md', '\n\n  hello  \n\n').text).toBe('hello');
  });
});
