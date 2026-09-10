import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ChatPanelComponent } from './chat-panel.component';
import { ChatService } from './chat.service';

/**
 * Floating launcher + panel for the résumé chatbot. Owns only open/closed state and
 * focus management; the conversation lives in `ChatService` and survives closing.
 */
@Component({
  selector: 'app-chat-widget',
  imports: [ChatPanelComponent, CdkTrapFocus, MatButtonModule, MatIconModule],
  template: `
    @if (open()) {
      <div class="chat-scrim fixed inset-0 z-40" aria-hidden="true" (click)="close()"></div>
      <div
        [id]="panelId"
        class="chat-sheet fixed inset-0 z-50 overflow-hidden sm:inset-auto sm:right-4 sm:bottom-24 sm:h-[min(40rem,calc(100dvh-8rem))] sm:w-md sm:rounded-2xl sm:border"
        cdkTrapFocus
        cdkTrapFocusAutoCapture
      >
        <app-chat-panel
          [turns]="chat.turns()"
          [pending]="chat.pending()"
          [error]="chat.error()"
          (send)="chat.send($event)"
          (retry)="chat.retry()"
          (close)="close()"
        />
      </div>
    }

    <button
      #fab
      matFab
      type="button"
      class="chat-fab fixed right-4 bottom-4 z-40"
      aria-label="Résumé assistant"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="open() ? panelId : null"
      (click)="toggle()"
    >
      <mat-icon aria-hidden="true">{{ open() ? 'close' : 'chat' }}</mat-icon>
    </button>
  `,
  styles: `
    .chat-scrim {
      background-color: color-mix(in srgb, var(--mat-sys-scrim) 32%, transparent);
    }

    .chat-sheet {
      border-color: var(--mat-sys-outline-variant);
      box-shadow: var(--mat-sys-level3);
      animation: card-rise 250ms ease-out;
    }

    // The panel is full-screen on phones and brings its own close button, so the
    // launcher would only sit on top of the composer.
    @media (max-width: 639.98px) {
      .chat-fab[aria-expanded='true'] {
        display: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatWidgetComponent {
  protected readonly chat = inject(ChatService);
  protected readonly open = signal(false);
  protected readonly panelId = 'chat-dialog';

  private readonly fab = viewChild.required('fab', { read: ElementRef<HTMLButtonElement> });

  protected toggle(): void {
    if (this.open()) {
      this.close();
    } else {
      this.open.set(true);
    }
  }

  protected close(): void {
    this.open.set(false);
    this.fab().nativeElement.focus();
  }
}
