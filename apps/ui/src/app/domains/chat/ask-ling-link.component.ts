import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ChatService } from './chat.service';

export type AskLingAppearance = 'text' | 'filled' | 'outlined';

/**
 * Contextual entry point into AI Ling: opens the chat with `question` already asked,
 * or — without one — just opens it, where the starter questions take over. The static
 * page states the narrative; these links hand the visitor over to the chat for the
 * depth.
 */
@Component({
  selector: 'app-ask-ling-link',
  imports: [MatButtonModule, MatIconModule],
  template: `
    <button
      [matButton]="appearance()"
      type="button"
      class="ask-ling min-h-11"
      aria-haspopup="dialog"
      [attr.data-cta-tracking]="trackingLabel()"
      (click)="ask()"
    >
      <span class="flex items-center gap-2">
        <mat-icon class="ask-ling-icon" aria-hidden="true">auto_awesome</mat-icon>
        <!-- Start-aligned: a label that wraps (long German questions) reads as text,
             not as a centred block. -->
        <span class="ask-ling-label text-start">{{ label() }}</span>
        <span class="sr-only">{{ screenReaderHint() }}</span>
      </span>
    </button>
  `,
  // A quiet mark at label size, not a 24px glyph: the page carries many of these
  // hooks, and only the gold email action should read as loud. (The icon sits in a
  // wrapper span, so Material's own 18px button-icon sizing doesn't reach it.)
  styles: `
    .ask-ling-icon {
      width: 1.125rem;
      height: 1.125rem;
      font-size: 1.125rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AskLingLinkComponent {
  private readonly chat = inject(ChatService);

  readonly question = input<string>();
  readonly label = input(
    $localize`:Default label of a link that opens the AI chat@@askLing.defaultLabel:Ask AI Ling`,
  );
  readonly appearance = input<AskLingAppearance>('text');

  protected readonly trackingLabel = computed(() => {
    const question = this.question();
    return question ? `Ask AI Ling: ${question}` : 'Ask AI Ling';
  });

  protected readonly screenReaderHint = computed(() => {
    const question = this.question();
    return question
      ? $localize`:Screen-reader-only suffix naming the question the link asks@@askLing.hintWithQuestion:: asks AI Ling “${question}:question:”`
      : $localize`:Screen-reader-only suffix for a link that just opens the chat@@askLing.hintPlain:: opens the AI Ling chat`;
  });

  protected ask(): void {
    this.chat.open(this.question());
  }
}
