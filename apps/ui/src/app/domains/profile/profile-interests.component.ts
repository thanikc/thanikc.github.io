import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SectionHeaderComponent } from './section-header.component';
import { Interest } from './profile.content';

/**
 * "Beyond the Code": the personality that keeps the page from reading like a CV.
 * Deliberately lighter than the work sections — compact cards, no shadow — and last.
 */
@Component({
  selector: 'app-profile-interests',
  imports: [MatIconModule, SectionHeaderComponent],
  template: `
    <section class="space-y-6" [attr.aria-labelledby]="headingId">
      <app-section-header
        heading="Beyond the Code"
        [headingId]="headingId"
        subtitle="How I stay physical, sharp, and curious away from the keyboard"
      />

      @if (interests().length > 0) {
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          @for (interest of interests(); track interest.name) {
            <article class="interest-card surface-card flex flex-col gap-2 rounded-xl p-4">
              <div class="flex items-center gap-3">
                <div class="surface-avatar flex items-center justify-center rounded-lg p-2">
                  <mat-icon aria-hidden="true">{{ interest.icon }}</mat-icon>
                </div>
                <h3 class="text-base font-bold">{{ interest.name }}</h3>
              </div>
              <p class="surface-muted text-sm">{{ interest.description }}</p>
            </article>
          }
        </div>
      } @else {
        <p class="surface-muted text-sm">Nothing to show yet.</p>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileInterestsComponent {
  readonly interests = input.required<readonly Interest[]>();

  protected readonly headingId = 'interests-heading';
}
