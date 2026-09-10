import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CHAT_SUGGESTIONS } from './chat.constants';
import { ChatTurn } from './chat.models';
import { MarkdownPipe } from './markdown.pipe';

let nextId = 0;

/** Presentational chat transcript + composer. State lives in `ChatService`, wired by the widget. */
@Component({
  selector: 'app-chat-panel',
  imports: [
    NgTemplateOutlet,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    TextFieldModule,
    MarkdownPipe,
  ],
  templateUrl: './chat-panel.component.html',
  styleUrl: './chat-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatPanelComponent {
  readonly turns = input.required<ChatTurn[]>();
  readonly pending = input(false);
  readonly error = input<string | null>(null);

  readonly send = output<string>();
  readonly close = output<void>();
  readonly retry = output<void>();

  protected readonly suggestions = CHAT_SUGGESTIONS;
  protected readonly draft = signal('');
  protected readonly headingId = `chat-heading-${nextId}`;
  protected readonly inputId = `chat-input-${nextId++}`;

  private readonly transcript = viewChild.required<ElementRef<HTMLElement>>('transcript');

  constructor() {
    // Keep the latest turn (or the typing indicator) in view as the conversation grows.
    afterRenderEffect(() => {
      this.turns();
      this.pending();
      this.error();
      const el = this.transcript().nativeElement;
      el.scrollTop = el.scrollHeight;
    });
  }

  protected submit(event?: Event): void {
    event?.preventDefault();
    const message = this.draft().trim();
    if (message === '' || this.pending()) return;

    this.send.emit(message);
    this.draft.set('');
  }

  /** Enter sends; Shift+Enter falls through to the textarea's newline. */
  protected onEnter(event: Event): void {
    const key = event as KeyboardEvent;
    if (key.shiftKey || key.isComposing) return;
    this.submit(event);
  }

  protected updateDraft(event: Event): void {
    this.draft.set((event.target as HTMLTextAreaElement).value);
  }
}
