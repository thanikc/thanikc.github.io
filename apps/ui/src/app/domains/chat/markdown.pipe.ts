import { Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';

/**
 * Converts an assistant turn's Markdown to HTML for `[innerHTML]` binding, which
 * runs Angular's `DomSanitizer` over the result: anything unsafe (scripts, event
 * handlers, `javascript:` URLs) is stripped before it reaches the DOM.
 */
@Pipe({ name: 'markdown' })
export class MarkdownPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    const source = value?.trim();
    return source ? marked.parse(source, { async: false, gfm: true, breaks: true }) : '';
  }
}
