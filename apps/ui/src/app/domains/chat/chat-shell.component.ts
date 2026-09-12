import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ChatWidgetComponent } from './chat-widget.component';

/**
 * Keeps the chatbot's interactive bundle out of the prerendered HTML and the
 * initial bundle. `on idle` rather than `on interaction`: an interaction trigger
 * would spend the visitor's first click on loading the chunk, so opening the
 * panel would take a second click.
 *
 * `on timer(4s)` is a bounded fallback alongside `on idle`: WebKit (Safari and,
 * since it's forced to use WebKit on iOS, Chrome on iPhone/iPad too) has never
 * reliably fired `requestIdleCallback` on first page load — the callback can go
 * unfired for the lifetime of the page, so the FAB never appears until a reload
 * re-arms it. The timer guarantees the widget loads within a few seconds even
 * when no idle period is ever reported.
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
 *
 * `position: sticky` plus a non-auto `z-index` makes this host a stacking context, so
 * everything painted inside it — including the open panel's `fixed inset-0 z-50` sheet —
 * is capped at this element's z-index when compared against unrelated fixed/sticky
 * siblings elsewhere on the page, no matter what z-index those descendants declare.
 * The header (`z-50`, sticky) and the scroll-to-top button (`z-40`, its own sticky
 * stacking context, later in the DOM) are two such siblings, so this has to outrank
 * both or they paint over the open chat sheet instead of under it.
 */
@Component({
  selector: 'app-chat-shell',
  imports: [ChatWidgetComponent],
  template: `
    <p class="sr-only">
      AI Ling, an AI assistant that answers questions about Thanik's professional experience, is
      available via the chat button on this page.
    </p>
    @defer (on idle; on timer(4s)) {
      <app-chat-widget />
    }
  `,
  styles: `
    :host {
      display: block;
      position: sticky;
      bottom: 0;
      z-index: 60;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatShellComponent {}
