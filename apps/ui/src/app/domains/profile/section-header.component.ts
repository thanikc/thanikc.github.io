import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

/** Eyebrow label and display headline that open each profile section. */
@Component({
  selector: 'app-section-header',
  // Block, not the custom-element default of inline: the parent section's `space-y-*`
  // margin does nothing on an inline box, and the content ran into the cards below.
  host: { class: 'block' },
  template: `
    <!-- One heading: heading navigation lists the section by name, then subtitle.
         The colon is for screen readers; visually the two sit on separate lines. -->
    <h2 [id]="headingId()" class="section-heading flex scroll-mt-24 flex-col gap-3">
      <span class="section-eyebrow page-muted font-mono text-xs tracking-widest uppercase">{{
        eyebrow()
      }}</span
      ><span class="sr-only">: </span>
      <span
        class="section-title font-display text-3xl font-normal tracking-tight sm:text-4xl"
        [class.page-heading]="!muted()"
        [class.page-muted]="muted()"
      >
        @if (heading(); as text) {
          {{ text }}
        } @else {
          <ng-content />
        }
      </span>
    </h2>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionHeaderComponent {
  /** Small tracked label above the headline, e.g. the section's short name. */
  readonly eyebrow = input.required<string>();
  /** Lets the enclosing `<section>` point `aria-labelledby` at the heading. */
  readonly headingId = input.required<string>();
  /** Plain-text headline; leave it out to project rich content (e.g. a <strong> clause). */
  readonly heading = input<string>();
  /** Sets the projected headline in the muted tone, for a <strong> clause to stand out of. */
  readonly muted = input(false, { transform: booleanAttribute });
}
