import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AskLingLinkComponent } from '../chat/ask-ling-link.component';
import { Project, ProjectLink } from './profile.content';

interface CardLink extends ProjectLink {
  appearance: 'outlined' | 'text';
}

/**
 * One project as evidence: what it is for, why it exists, one engineering decision,
 * its stack and status — then explicit actions. A static article rather than one
 * big link, because it holds several actions (a button can't nest inside a link).
 */
@Component({
  selector: 'app-project-card',
  imports: [RouterLink, MatButtonModule, MatIconModule, AskLingLinkComponent],
  templateUrl: './project-card.component.html',
  styles: `
    :host {
      display: block;
    }

    .project-status-icon {
      width: 16px;
      height: 16px;
      font-size: 16px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCardComponent {
  readonly project = input.required<Project>();

  /** The primary action reads as a button; the source link stays quieter. */
  protected readonly links = computed<CardLink[]>(() => {
    const { primary, source } = this.project();
    return [
      ...(primary ? [{ ...primary, appearance: 'outlined' as const }] : []),
      ...(source ? [{ ...source, appearance: 'text' as const }] : []),
    ];
  });
}
