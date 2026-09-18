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
  host: {
    // The host, not the inner <article>, is the flex item in profile-projects'
    // row — the class has to land here for that row to grow the right element.
    '[class.is-expanded]': 'expanded()',
  },
  templateUrl: './project-card.component.html',
  styles: `
    :host {
      display: block;
      min-width: 0;
    }

    /* One horizontal row: all tiles equal
     * width at rest, the hovered/expanded one claims more of the row and the
     * rest yield — a plain flex-grow transition, not a JS width measurement.
     * Row layout itself lives in profile-projects (this only reacts to being
     * inside one); a lone card outside a flex row just ignores flex-grow.
     *
     * The 120ms delay is only on the *shrink-back* rule, not the grow one —
     * found live: leaving a tile near the seam where it meets its neighbour,
     * the seam sweeps across the (stationary) cursor as the tile shrinks and
     * the neighbour grows to fill in, handing :hover back and forth between
     * them mid-transition and flickering. Growing has no delay (transitions
     * always run using the *target* state's own transition), so a re-entry
     * within that window cancels the pending shrink instead of visibly
     * snapping — the delay only ever costs 120ms on a genuine mouse-leave. */
    @media (min-width: 768px) {
      :host {
        flex: 1 1 0%;
        transition: flex-grow 350ms ease-out 120ms;
      }

      :host(:hover),
      :host(.is-expanded) {
        flex-grow: 4;
        transition: flex-grow 350ms ease-out;
      }
    }

    /* Reference proportions: tall/portrait tiles, no border — the fill against
     * the page background is the only boundary (surfaces.scss's .surface-card
     * also draws a 1px outline, meant for a card sitting among unfilled flat
     * content; here every tile has the same fill, so that outline just added a
     * seam the reference doesn't have — overridden off, fill kept). */
    .project-card {
      border: none;
      min-height: 26rem;
    }

    /* A plain <button>, reset to look like the rest of the card's text, not a
     * native grey button — its only job is being a real, focusable, tappable
     * control, with no visible affordance beyond what hover already implies.
     * flex-1 + the title's mt-auto (template) is what pins the status pill to
     * the top and the name to the bottom, with the reference's empty middle
     * between them, instead of the two sitting stacked together. */
    .project-face {
      background: none;
      border: none;
      padding: 0;
      margin: 0;
      font: inherit;
      color: inherit;
      cursor: pointer;
      flex: 1;
    }

    /* Decorative pixel mark in the tile's empty middle (reference): generated from
     * the name rather than drawn per project, so adding a project needs no artwork.
     * Sized in rem so it stays a mark and not a hero image, with the centre column
     * in the accent colour — the reference's tinted spine. */
    .project-mark {
      width: 4.5rem;
      height: 4.5rem;
      fill: currentColor;
    }

    .project-mark .accent {
      fill: var(--mat-sys-primary);
    }

    /* The resume printout is text; the mark is decoration that only costs ink. */
    @media print {
      .project-mark {
        display: none;
      }
    }

    /* Minimal by default (name, status); the rest reveals on hover or by tapping
     * the face above — the keyboard/touch equivalent, since :hover has neither.
     * 'visibility: hidden' is load-bearing, not cosmetic: 'overflow: hidden' +
     * 'max-height: 0' alone only clip how the collapsed content *paints* — its
     * interactive children keep their full natural geometry (and tab stop) at
     * whatever position that content would render, overlapping whatever's
     * actually visible there. Found via the design-check suite: a "collapsed"
     * link's own rect still touching the next card's live one, and tabbing into
     * that same off-screen geometry ahead of the next card's own (visually
     * earlier) toggle button. 'visibility: hidden' removes them from
     * hit-testing and tab order outright, which is also why revealing on
     * keyboard focus-within isn't needed here: nothing inside can *get* focus
     * while collapsed, so the toggle button is the only keyboard/touch path in,
     * same as it is for a mouse without a pointer over the card. */
    .project-details {
      overflow: hidden;
      visibility: hidden;
      max-height: 0;
      opacity: 0;
      transition:
        max-height 300ms ease-out 120ms,
        opacity 200ms ease-out 120ms,
        visibility 300ms 120ms;
    }

    .project-card:hover .project-details,
    .project-card.is-expanded .project-details {
      visibility: visible;
      max-height: 48rem;
      opacity: 1;
      transition:
        max-height 300ms ease-out,
        opacity 200ms ease-out,
        visibility 300ms;
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

  protected readonly detailsToggleLabel = computed(
    () =>
      $localize`:Accessible label for the button that reveals a project card's details@@projects.detailsToggle:More about ${this.project().name}:projectName:`,
  );

  /** Built here, not in the template: `i18n-` only marks up static attributes. */
  protected readonly flowLabel = computed(
    () =>
      $localize`:Accessible name of the how-it-works diagram on a project card@@projects.flowLabel:How ${this.project().name}:projectName: works`,
  );

  /** The primary action reads as a button; the source link stays quieter. */
  protected readonly links = computed<CardLink[]>(() => {
    const { primary, source } = this.project();
    return [
      ...(primary ? [{ ...primary, appearance: 'outlined' as const }] : []),
      ...(source ? [{ ...source, appearance: 'text' as const }] : []),
    ];
  });
}
