import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Eyebrow label and display headline that open each profile section. */
@Component({
  selector: 'app-section-header',
  // Block, not the custom-element default of inline: the parent section's `space-y-*`
  // margin does nothing on an inline box, and the content ran into the cards below.
  host: { class: 'block' },
  template: `
    <div class="space-y-3">
      <p class="page-muted font-mono text-xs tracking-widest uppercase">{{ eyebrow() }}</p>
      <h2
        [id]="headingId()"
        class="section-heading page-heading font-display scroll-mt-24 text-3xl font-normal tracking-tight sm:text-4xl"
      >
        {{ heading() }}
      </h2>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionHeaderComponent {
  /** Small tracked label above the headline, e.g. the section's short name. */
  readonly eyebrow = input.required<string>();
  /** Lets the enclosing `<section>` point `aria-labelledby` at the heading. */
  readonly headingId = input.required<string>();
  readonly heading = input.required<string>();
}
