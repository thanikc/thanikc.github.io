import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CHAT_SUGGESTIONS } from './chat.constants';
import { ChatTurn } from './chat.models';
import { MarkdownPipe } from './markdown.pipe';
import { SpeechRecognitionService } from './speech-recognition.service';

let nextId = 0;

/** Distance from the bottom still counted as "following along", in pixels. */
const FOLLOW_THRESHOLD_PX = 64;

/**
 * User-facing text for recognition errors worth surfacing. `no-speech` and `aborted`
 * are expected/silent outcomes (timeout, user stopped it) and are omitted on purpose.
 */
const MIC_ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Voice input needs microphone and speech recognition permission for this site.',
  'service-not-allowed':
    'Voice input needs microphone and speech recognition permission for this site.',
  'audio-capture': 'No microphone was found.',
  network: 'Voice input needs a network connection.',
  'not-supported': "This browser doesn't support voice input.",
};

/** Presentational chat transcript + composer. State lives in `ChatService`, wired by the widget. */
@Component({
  selector: 'app-chat-panel',
  imports: [
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
  protected readonly canSend = computed(() => this.draft().trim() !== '' && !this.pending());
  protected readonly headingId = `chat-heading-${nextId}`;
  protected readonly inputId = `chat-input-${nextId++}`;
  protected readonly listening = signal(false);
  protected readonly micError = signal<string | null>(null);

  private readonly speech = inject(SpeechRecognitionService);
  /** Checked once: real browser support doesn't change over a component's lifetime. */
  protected readonly micSupported = this.speech.isSupported();
  private readonly transcript = viewChild.required<ElementRef<HTMLElement>>('transcript');

  /** Whether new turns should pull the view down. False once the reader scrolls up. */
  private following = true;

  constructor() {
    // Follow the conversation as it grows, but only for a reader who is already at
    // the bottom: scrolling someone away from the answer they are re-reading is worse
    // than making them scroll down themselves.
    afterRenderEffect(() => {
      this.turns();
      this.pending();
      this.error();
      if (!this.following) return;

      const el = this.transcript().nativeElement;
      el.scrollTop = el.scrollHeight;
    });
  }

  protected trackScrollPosition(): void {
    const el = this.transcript().nativeElement;
    this.following = el.scrollHeight - el.scrollTop - el.clientHeight <= FOLLOW_THRESHOLD_PX;
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

  protected toggleMic(): void {
    if (this.listening()) {
      this.speech.stop();
      return;
    }

    this.micError.set(null);
    this.listening.set(true);
    this.speech.start({
      onResult: transcript => {
        const prefix = this.draft().trim();
        this.draft.set(prefix ? `${prefix} ${transcript}` : transcript);
      },
      onEnd: () => this.listening.set(false),
      onError: error => {
        this.listening.set(false);
        this.micError.set(MIC_ERROR_MESSAGES[error] ?? null);
      },
    });
  }
}
