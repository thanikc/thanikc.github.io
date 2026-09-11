import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AskLingLinkComponent } from '../chat/ask-ling-link.component';

/**
 * Reframes AI Ling as the fast path through the page, not just a project card: a
 * short pitch plus example questions a visitor can click straight into the chat.
 */
@Component({
  selector: 'app-profile-ask-ling',
  imports: [AskLingLinkComponent],
  templateUrl: './profile-ask-ling.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileAskLingComponent {
  readonly prompts = input.required<readonly string[]>();

  protected readonly headingId = 'ask-ling-heading';
}
