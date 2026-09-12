import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  DOCUMENT,
  ElementRef,
  Injector,
  afterNextRender,
  effect,
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
 * Floating launcher for the résumé chatbot. The launcher and the panel are mutually
 * exclusive — opening swaps the button out for the panel, closing swaps it back and
 * returns focus. The conversation lives in `ChatService` and survives closing.
 *
 * The panel is a hand-rolled `cdkTrapFocus` sheet rather than `MatDialog` on purpose:
 * `MatDialog` is built on `@angular/cdk/overlay`, and with `cli.cache.enabled: false`
 * in this repo's `angular.json`, importing that overlay/scrolling module blows up the
 * dev server (`Cannot read properties of undefined (reading 'CdkScrollable')`). A
 * centred modal also doesn't fit this widget's docked, anchor-to-corner layout, which
 * `MatDialog` doesn't support without overriding its internal DOM — itself against the
 * "don't override internal Material DOM" rule.
 */
@Component({
  selector: 'app-chat-widget',
  imports: [ChatPanelComponent, CdkTrapFocus, MatButtonModule, MatIconModule],
  templateUrl: './chat-widget.component.html',
  styleUrl: './chat-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatWidgetComponent {
  protected readonly chat = inject(ChatService);
  protected readonly panelId = 'chat-dialog';

  /**
   * The launcher's tip is a hover affordance, which touch does not have. It reveals
   * itself once shortly after arrival instead, then retires for good: a visitor who
   * has opened the chat already knows what the portrait button does.
   */
  protected readonly showHint = signal(true);

  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);
  private readonly fab = viewChild('fab', { read: ElementRef<HTMLButtonElement> });

  /** Whatever had focus when the chat opened; focus goes back there on close. */
  private returnFocusTo: HTMLElement | null = null;

  constructor() {
    // The chat can be opened from anywhere on the page, not just the FAB. The effect
    // runs before the panel renders and captures focus, so the opener is still active.
    effect(() => {
      if (!this.chat.isOpen()) return;

      this.showHint.set(false);
      // <body> means nothing had focus (e.g. a mouse click on a non-focusing browser).
      const active = this.document.activeElement;
      this.returnFocusTo =
        active instanceof HTMLElement && active !== this.document.body ? active : null;
    });

    // The sheet covers the viewport on mobile and docks over the page on wider
    // screens; either way, scrolling inside it shouldn't also scroll the page
    // behind it. Locked via a body class rather than the effect above since it
    // has nothing to do with focus, and needs its own teardown.
    effect(() => {
      this.document.body.classList.toggle('chat-scroll-lock', this.chat.isOpen());
    });
    inject(DestroyRef).onDestroy(() => this.document.body.classList.remove('chat-scroll-lock'));
  }

  protected launch(): void {
    this.chat.open();
  }

  protected close(): void {
    this.chat.close();
    const opener = this.returnFocusTo;
    this.returnFocusTo = null;

    // A FAB opener was swapped out for the panel, so fall back to the fresh FAB.
    afterNextRender(() => (opener?.isConnected ? opener : this.fab()?.nativeElement)?.focus(), {
      injector: this.injector,
    });
  }
}
