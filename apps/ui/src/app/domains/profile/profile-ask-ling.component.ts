import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AskLingLinkComponent } from '../chat/ask-ling-link.component';

/**
 * Reframes AI Ling as the fast path through the page, not just a project card: a
 * short pitch plus example questions a visitor can click straight into the chat.
 *
 * Redesign: folded into `app-profile-hero` rather than its own
 * boxed card right below it, so this renders plain content, not a landmark of its
 * own — colours itself for the hero's dark surface, the only place it's used.
 */
@Component({
  selector: 'app-profile-ask-ling',
  imports: [AskLingLinkComponent],
  templateUrl: './profile-ask-ling.component.html',
  styles: `
    :host {
      display: block;
      color: var(--mat-sys-inverse-on-surface);
    }

    .ask-ling-pitch {
      color: color-mix(in srgb, var(--mat-sys-inverse-on-surface) 82%, transparent);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileAskLingComponent {
  readonly prompts = input.required<readonly string[]>();
}
