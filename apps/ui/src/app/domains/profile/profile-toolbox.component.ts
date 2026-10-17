import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AskLingLinkComponent } from '../chat/ask-ling-link.component';
import { SectionHeaderComponent } from './section-header.component';
import { ToolGroup } from './profile.content';

/**
 * The stack as a compact, scannable list — for recruiters and keyword scans. It
 * follows the work and the principles instead of leading the page.
 */
@Component({
  selector: 'app-profile-toolbox',
  imports: [SectionHeaderComponent, AskLingLinkComponent],
  template: `
    <section [attr.aria-labelledby]="headingId">
      <!-- Reference band: the opener holds its own column on the left and the
           groups run down the right, so the section reads as two columns of
           whitespace rather than a heading stacked on a list. One column below lg. -->
      <div class="toolbox-band grid gap-8 lg:grid-cols-[2fr_3fr] lg:gap-16">
        <div class="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <app-section-header
            i18n-eyebrow="Heading of the toolbox section@@toolbox.heading"
            eyebrow="Toolbox"
            [headingId]="headingId"
            i18n-heading="Subtitle of the toolbox section@@toolbox.subtitle"
            heading="The stack behind the work above"
          />
          <app-ask-ling-link class="-ml-3 block" [question]="question" [label]="hookLabel" />
        </div>

        @if (groups().length > 0) {
          <!-- Flat on the page, no boxed card: one hairline-ruled
               row per group, mono label above the tools it covers. -->
          <dl>
            @for (group of groups(); track group.name) {
              <div class="surface-rule space-y-2 border-t py-5">
                <dt class="page-muted font-mono text-xs tracking-widest uppercase">
                  {{ group.name }}
                </dt>
                <dd class="page-heading font-display text-lg leading-snug sm:text-xl">
                  {{ group.tools.join(' · ') }}
                </dd>
              </div>
            }
          </dl>
        } @else {
          <p class="page-muted text-sm" i18n="@@common.emptySection">Nothing to show yet.</p>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileToolboxComponent {
  readonly groups = input.required<readonly ToolGroup[]>();

  protected readonly headingId = 'toolbox-heading';
  protected readonly hookLabel = $localize`:Ask AI Ling hook in the toolbox section@@toolbox.hookLabel:Ask which ones I use day to day`;
  protected readonly question = $localize`:Question the toolbox hook asks AI Ling@@toolbox.question:Which of these tools does Thanik use day to day, and for what?`;
}
