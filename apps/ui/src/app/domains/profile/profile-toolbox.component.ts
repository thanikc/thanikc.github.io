import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SectionHeaderComponent } from './section-header.component';
import { ToolGroup } from './profile.content';

/**
 * The stack as a compact, scannable list — for recruiters and keyword scans. It
 * follows the work and the principles instead of leading the page.
 */
@Component({
  selector: 'app-profile-toolbox',
  imports: [SectionHeaderComponent],
  template: `
    <section class="space-y-6" [attr.aria-labelledby]="headingId">
      <app-section-header
        heading="Toolbox"
        [headingId]="headingId"
        subtitle="The stack behind the work above"
      />

      @if (groups().length > 0) {
        <!-- Two columns from sm up: group names size to the longest, tools take the rest. -->
        <dl
          class="surface-card grid grid-cols-1 gap-x-6 gap-y-1 rounded-xl p-6 text-sm shadow-sm sm:grid-cols-[max-content_1fr] sm:gap-y-3"
        >
          @for (group of groups(); track group.name) {
            <dt class="font-semibold">{{ group.name }}</dt>
            <dd class="surface-muted mb-2 sm:mb-0">{{ group.tools.join(' · ') }}</dd>
          }
        </dl>
      } @else {
        <p class="surface-muted text-sm">Nothing to show yet.</p>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileToolboxComponent {
  readonly groups = input.required<readonly ToolGroup[]>();

  protected readonly headingId = 'toolbox-heading';
}
