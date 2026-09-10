import { renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  it('renders inline emphasis as HTML tags', () => {
    const html = renderMarkdown('**bold** and *italic*');

    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
  });

  it('renders bullet lists', () => {
    const html = renderMarkdown('- one\n- two');

    expect(html).toContain('<ul>');
    expect(html).toContain('<li>one</li>');
    expect(html).toContain('<li>two</li>');
  });

  it('renders links with their href', () => {
    expect(renderMarkdown('[site](https://example.com)')).toContain(
      '<a href="https://example.com">site</a>',
    );
  });

  it('keeps a single newline as a hard break inside a paragraph', () => {
    expect(renderMarkdown('line one\nline two')).toContain('<br>');
  });

  it('renders fenced code blocks', () => {
    expect(renderMarkdown('```\nconst x = 1;\n```')).toContain('<pre>');
  });

  it('returns an empty string for blank input', () => {
    expect(renderMarkdown('')).toBe('');
    expect(renderMarkdown('   ')).toBe('');
  });
});
