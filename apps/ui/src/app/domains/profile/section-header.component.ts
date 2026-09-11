import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Heading, subtitle and divider that open each profile section. */
@Component({
  selector: 'app-section-header',
  // Block, not the custom-element default of inline: the parent section's `space-y-*`
  // margin does nothing on an inline box, and the divider ran into the cards below.
  host: { class: 'block' },
  template: `
    <div class="surface-rule border-b pb-3">
      <h2 [id]="headingId()" class="scroll-mt-24 text-2xl font-bold tracking-tight">
        {{ heading() }}
      </h2>
      <p class="surface-muted text-sm font-medium">{{ subtitle() }}</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionHeaderComponent {
  readonly heading = input.required<string>();
  /** Lets the enclosing `<section>` point `aria-labelledby` at the heading. */
  readonly headingId = input.required<string>();
  readonly subtitle = input.required<string>();
}
