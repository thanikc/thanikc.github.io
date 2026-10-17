import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AskLingLinkComponent } from '../chat/ask-ling-link.component';
import { Project, ProjectLink } from './profile.content';

/** Pixel-mark grid: odd-sized so there is a centre column to mirror on and tint. */
const MARK_SIZE = 7;
const MARK_MID = (MARK_SIZE - 1) / 2;
const MARK_FILL_PERCENT = 55;

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
  imports: [RouterLink, MatButtonModule, AskLingLinkComponent],
  templateUrl: './project-card.component.html',
  styles: `
    :host {
      display: block;
      min-width: 0;
    }

    /* Tiles share one fill and sit in a grid, so the fill against the page is the
     * boundary; .surface-card's 1px outline would only add a seam between them. */
    .project-card {
      border: none;
    }

    .project-mark {
      width: 2.25rem;
      height: 2.25rem;
      flex: none;
      fill: currentColor;
    }

    .project-mark .accent {
      fill: var(--mat-sys-primary);
    }

    /* A text control, not a grey native button: its job is to be a real, focusable
     * 44px target. The underline marks it as an action without an icon. */
    .project-toggle {
      background: none;
      border: none;
      padding: 0;
      font: inherit;
      font-weight: 600;
      color: inherit;
      cursor: pointer;
      text-decoration: underline;
      text-underline-offset: 0.25em;
      text-decoration-thickness: 1px;
    }

    /* Collapsed with grid rows (0fr → 1fr) rather than max-height: the row sizes to
     * the content, so nothing is clipped or over-reserved. 'visibility: hidden' takes
     * the collapsed links out of hit-testing and tab order, not just out of view. */
    .project-details {
      display: grid;
      grid-template-rows: 0fr;
      visibility: hidden;
      opacity: 0;
      transition:
        grid-template-rows 250ms cubic-bezier(0.22, 1, 0.36, 1),
        opacity 200ms ease-out,
        visibility 250ms;
    }

    .project-details-inner {
      min-height: 0;
      overflow: hidden;
    }

    .project-card.is-expanded .project-details {
      grid-template-rows: 1fr;
      visibility: visible;
      opacity: 1;
    }

    /* The resume printout is text; the mark is decoration that only costs ink. */
    @media print {
      .project-mark {
        display: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCardComponent {
  readonly project = input.required<Project>();
  /** 0-based position across all projects; only used to key detailsId uniquely. */
  readonly index = input.required<number>();

  protected readonly expanded = signal(false);
  protected readonly detailsId = computed(() => `project-details-${this.index()}`);
  protected readonly headingId = computed(() => `project-name-${this.index()}`);

  /**
   * The mark's cells, mirrored across the centre column so it reads as a mark and
   * not noise, and seeded by the name so each project keeps its own across renders.
   */
  protected readonly markCells = computed(() => {
    const name = this.project().name;
    let seed = 2166136261;
    for (let i = 0; i < name.length; i++) seed = Math.imul(seed ^ name.charCodeAt(i), 16777619);

    const cells: { x: number; y: number }[] = [];
    for (let y = 0; y < MARK_SIZE; y++) {
      for (let x = 0; x <= MARK_MID; x++) {
        seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; // one draw per cell
        // The centre column is always solid: it is the accent spine the reference
        // runs through every mark, and it keeps a sparse draw from reading as dust.
        if (x !== MARK_MID && seed % 100 >= MARK_FILL_PERCENT) continue;
        cells.push({ x, y });
        if (x < MARK_MID) cells.push({ x: MARK_SIZE - 1 - x, y });
      }
    }
    return cells;
  });

  protected toggle(): void {
    this.expanded.update(value => !value);
  }

  /** Built here, not in the template: `i18n-` only marks up static attributes. */
  protected readonly flowLabel = computed(
    () =>
      $localize`:Accessible name of the how-it-works diagram on a project card@@projects.flowLabel:How ${this.project().name}:projectName: works`,
  );

  /**
   * The first action reads as a button on every card; a source link next to a
   * primary action stays quieter, and is the button itself when it stands alone.
   */
  protected readonly links = computed<CardLink[]>(() => {
    const { primary, source } = this.project();
    return [
      ...(primary ? [{ ...primary, appearance: 'outlined' as const }] : []),
      ...(source
        ? [{ ...source, appearance: primary ? ('text' as const) : ('outlined' as const) }]
        : []),
    ];
  });
}
