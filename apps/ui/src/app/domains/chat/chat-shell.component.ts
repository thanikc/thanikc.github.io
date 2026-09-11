import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ChatWidgetComponent } from './chat-widget.component';

/**
 * Keeps the chatbot's interactive bundle out of the prerendered HTML and the
 * initial bundle. `on idle` rather than `on interaction`: an interaction trigger
 * would spend the visitor's first click on loading the chunk, so opening the
 * panel would take a second click.
 *
 * The sr-only paragraph outside the `@defer` block is static: it ships in the
 * prerendered HTML so crawlers that never execute JS (AEO/LLM bots included)
 * still learn the assistant exists, even though its launcher button doesn't
 * render until the deferred widget loads.
 *
 * The host is a zero-height `position: sticky` anchor sitting just above the footer:
 * the launcher inside it floats near the viewport bottom while scrolling, then comes
 * to rest above the footer instead of covering it. `mt-auto` (set in the template)
 * keeps that rest position pinned to the footer on short pages too.
 */
@Component({
  selector: 'app-chat-shell',
  imports: [ChatWidgetComponent],
  template: `
    <p class="sr-only">
      AI Ling, an AI assistant that answers questions about Thanik's professional experience, is
      available via the chat button on this page.
    </p>
    @defer (on idle) {
      <app-chat-widget />
    }
  `,
  styles: `
    :host {
      display: block;
      position: sticky;
      bottom: 0;
      z-index: 40;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatShellComponent {}
