import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ChatService } from './chat.service';

export type AskLingAppearance = 'text' | 'filled';

/**
 * Contextual entry point into AI Ling: opens the chat with `question` already asked.
 * The static page states the narrative; these links hand the visitor over to the
 * chat for the depth. Carries the launcher's portrait so it visibly belongs to it.
 */
@Component({
  selector: 'app-ask-ling-link',
  imports: [MatButtonModule],
  template: `
    <button
      [matButton]="appearance()"
      type="button"
      class="ask-ling min-h-11"
      aria-haspopup="dialog"
      [attr.data-cta-tracking]="'Ask AI Ling: ' + question()"
      (click)="ask()"
    >
      <span class="flex items-center gap-2">
        <img
          class="ask-ling-avatar size-6 shrink-0 rounded-full"
          src="img/chat_avatar_352x432.png"
          alt=""
          aria-hidden="true"
          width="24"
          height="24"
        />
        <span class="ask-ling-label">{{ label() }}</span>
        <span class="sr-only">: asks AI Ling “{{ question() }}”</span>
      </span>
    </button>
  `,
  styles: `
    .ask-ling-avatar {
      object-fit: cover;
      object-position: top center;
      border: 1px solid var(--mat-sys-outline-variant);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AskLingLinkComponent {
  private readonly chat = inject(ChatService);

  readonly question = input.required<string>();
  readonly label = input('Ask AI Ling');
  readonly appearance = input<AskLingAppearance>('text');

  protected ask(): void {
    this.chat.open(this.question());
  }
}
