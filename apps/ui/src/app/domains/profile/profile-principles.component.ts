import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AskLingLinkComponent } from '../chat/ask-ling-link.component';
import { SectionHeaderComponent } from './section-header.component';
import { Principle } from './profile.content';

/** "How I work": a few habits, each pointing at evidence rather than adjectives. */
@Component({
  selector: 'app-profile-principles',
  imports: [MatButtonModule, MatIconModule, AskLingLinkComponent, SectionHeaderComponent],
  templateUrl: './profile-principles.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePrinciplesComponent {
  readonly principles = input.required<readonly Principle[]>();

  protected readonly headingId = 'principles-heading';
}
