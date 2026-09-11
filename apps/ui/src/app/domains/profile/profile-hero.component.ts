import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AskLingLinkComponent } from '../chat/ask-ling-link.component';
import { contactLink } from '../../shared/contact/contact-links';

/**
 * Who Thanik is and what he builds, in one sentence — then the hand-off: the page is
 * the short version, AI Ling the long one. Static presentation, no inputs.
 */
@Component({
  selector: 'app-profile-hero',
  imports: [MatButtonModule, AskLingLinkComponent],
  templateUrl: './profile-hero.component.html',
  styleUrl: './profile-hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileHeroComponent {
  protected readonly title = 'Full-stack engineer';
  protected readonly positioning =
    'I build large Angular and Spring Boot applications for German online banking, and use AI to move faster without lowering the bar.';
  protected readonly invitation = 'This page is the short version. AI Ling has the long one.';
  protected readonly email = contactLink('Email');
  protected readonly linkedIn = contactLink('LinkedIn');
}
