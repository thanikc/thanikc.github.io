import { Pipe, PipeTransform } from '@angular/core';
import { renderMarkdown } from './markdown';

/** Converts an assistant turn's Markdown to HTML for `[innerHTML]` binding. */
@Pipe({ name: 'markdown' })
export class MarkdownPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return renderMarkdown(value ?? '');
  }
}
