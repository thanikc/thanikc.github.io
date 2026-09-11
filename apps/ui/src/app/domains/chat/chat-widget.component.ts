import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
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
  protected readonly open = signal(false);
  protected readonly panelId = 'chat-dialog';

  /**
   * The launcher's tip is a hover affordance, which touch does not have. It reveals
   * itself once shortly after arrival instead, then retires for good: a visitor who
   * has opened the chat already knows what the portrait button does.
   */
  protected readonly showHint = signal(true);

  private readonly injector = inject(Injector);
  private readonly fab = viewChild('fab', { read: ElementRef<HTMLButtonElement> });

  protected launch(): void {
    this.showHint.set(false);
    this.open.set(true);
  }

  protected close(): void {
    this.open.set(false);
    afterNextRender(() => this.fab()?.nativeElement.focus(), { injector: this.injector });
  }
}
