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
import { ChatPanelComponent } from './chat-panel.component';
import { ChatService } from './chat.service';

/**
 * Floating launcher for the résumé chatbot. The launcher and the panel are mutually
 * exclusive — opening swaps the button out for the panel, closing swaps it back and
 * returns focus. The conversation lives in `ChatService` and survives closing.
 */
@Component({
  selector: 'app-chat-widget',
  imports: [ChatPanelComponent, CdkTrapFocus, MatButtonModule],
  templateUrl: './chat-widget.component.html',
  styleUrl: './chat-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatWidgetComponent {
  protected readonly chat = inject(ChatService);
  protected readonly open = signal(false);
  protected readonly panelId = 'chat-dialog';

  private readonly injector = inject(Injector);
  private readonly fab = viewChild('fab', { read: ElementRef<HTMLButtonElement> });

  protected launch(): void {
    this.open.set(true);
  }

  protected close(): void {
    this.open.set(false);
    afterNextRender(() => this.fab()?.nativeElement.focus(), { injector: this.injector });
  }
}
