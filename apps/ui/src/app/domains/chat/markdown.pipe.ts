import { Pipe, PipeTransform } from '@angular/core';
import { Marked } from 'marked';

const SITE_ORIGIN = 'https://thanikc.github.io/';

const isAllowedHref = (href: string): boolean =>
  href.startsWith('mailto:') ||
  href.startsWith('/') ||
  href.startsWith('#') ||
  href.startsWith(SITE_ORIGIN);

// Own instance: the global `marked` could be configured elsewhere.
const markdown = new Marked({
  gfm: true,
  breaks: true,
  renderer: {
    // Images never load from model output (tracking pixels, exfiltration): alt text only.
    image: ({ text }) => text,
    link({ href, tokens }) {
      const text = this.parser.parseInline(tokens);
      if (!isAllowedHref(href)) return text;
      // Site links open in a new tab: following one must not end the conversation.
      const target = href.startsWith(SITE_ORIGIN)
        ? ' target="_blank" rel="noopener noreferrer"'
        : '';
      return `<a${target} href="${href}">${text}</a>`;
    },
  },
});

/**
 * Converts an assistant turn's Markdown to HTML for `[innerHTML]` binding, which
 * runs Angular's `DomSanitizer` over the result: anything unsafe (scripts, event
 * handlers, `javascript:` URLs) is stripped before it reaches the DOM. Only site,
 * site-relative, anchor and `mailto:` links survive; other links render as their text
 * and images as their alt text.
 */
@Pipe({ name: 'markdown' })
export class MarkdownPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    const source = value?.trim();
    if (!source) return '';
    return markdown.parse(source, { async: false });
  }
}
