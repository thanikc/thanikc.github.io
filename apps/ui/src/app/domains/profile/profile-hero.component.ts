import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { contactLink } from '../../shared/contact/contact-links';

/**
 * Who Thanik is and what he builds, in one sentence. The Ask AI Ling pitch lives in
 * its own section right below (app-profile-ask-ling), not repeated here.
 */
@Component({
  selector: 'app-profile-hero',
  imports: [MatButtonModule],
  templateUrl: './profile-hero.component.html',
  styleUrl: './profile-hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileHeroComponent {
  protected readonly title = 'Senior Full-Stack Engineer';
  protected readonly positioning =
    "I build Angular and Spring Boot systems for German online banking — a shared platform across many banks, not one app — and lean on AI heavily without lowering the bar. I'm as curious about how AI is reshaping serious engineering as about what I build with it.";
  protected readonly email = contactLink('Email');
  protected readonly linkedIn = contactLink('LinkedIn');
}
