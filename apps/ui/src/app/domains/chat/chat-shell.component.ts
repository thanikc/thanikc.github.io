import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ChatWidgetComponent } from './chat-widget.component';

/**
 * Keeps the chatbot out of the prerendered HTML and the initial bundle. `on idle`
 * rather than `on interaction`: an interaction trigger would spend the visitor's first
 * click on loading the chunk, so opening the panel would take a second click. The
 * widget is fixed-position, so the empty placeholder causes no layout shift.
 */
@Component({
  selector: 'app-chat-shell',
  imports: [ChatWidgetComponent],
  template: `
    @defer (on idle) {
      <app-chat-widget />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatShellComponent {}
