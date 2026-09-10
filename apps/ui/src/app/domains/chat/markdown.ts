import { marked } from 'marked';

/**
 * Renders a Markdown string to an HTML string for the chat transcript.
 *
 * The result is bound with `[innerHTML]`, so Angular's `DomSanitizer` strips
 * anything unsafe (scripts, event handlers, `javascript:` URLs) before it
 * reaches the DOM — this function only handles the Markdown → HTML step.
 */
export function renderMarkdown(value: string): string {
  const source = value?.trim();
  if (!source) return '';

  return marked.parse(source, { async: false, gfm: true, breaks: true });
}
