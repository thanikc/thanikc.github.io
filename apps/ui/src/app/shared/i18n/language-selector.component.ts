import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { LocaleService } from './locale.service';
import { SupportedLocale } from './locales';

/**
 * Language picker for the header. Each language names itself, so the option a
 * visitor is looking for is readable even when the page around it is not; the flag
 * ahead of it is a second, language-independent cue, and the only thing a phone has
 * room to show once the label hides at `sm`.
 *
 * The flag is drawn as inline SVG, not the `regionTag`'s flag emoji: a flag emoji is
 * only as good as the system font rendering it, and plenty (this repo's own dev
 * sandbox included) fall back to two blank boxes for a flag sequence. An `<option>`
 * can't hold SVG, so the dropdown list falls back to plain text — a transient native
 * popup, not the always-visible pill this is really about.
 *
 * A native `<select>`, not `MatSelect`: `@angular/cdk/overlay` is unusable in this
 * app (documented on `chat-widget.component.ts` — the CLI cache is off, and the
 * overlay's circular imports then break the dev server), and `MatSelect` is built on
 * it. The platform control also gets the phone's own language wheel and full
 * keyboard support for free, which is the better trade here anyway.
 *
 * The pill you see (flag, label, caret) is plain content, not a styled `<select>`: the
 * real `<select>` sits on top of it, sized to match exactly, with its own text made
 * transparent so the OS still draws its focus ring, its native picker and its hit
 * target, while what a visitor actually reads is the content underneath.
 */
@Component({
  selector: 'app-language-selector',
  imports: [MatIconModule],
  template: `
    <span
      class="language-selector relative inline-flex h-11 items-center gap-1.5 rounded-full pr-2 pl-2.5 sm:pr-2.5"
      [class.language-selector--disabled]="!locale.canSwitchLocale"
    >
      <span class="language-flag" aria-hidden="true">
        @switch (countryOf(locale.currentOption.regionTag)) {
          @case ('US') {
            <svg viewBox="0 0 20 14">
              <rect width="20" height="14" fill="#B22234" />
              <rect y="1.08" width="20" height="1.08" fill="#fff" />
              <rect y="3.23" width="20" height="1.08" fill="#fff" />
              <rect y="5.38" width="20" height="1.08" fill="#fff" />
              <rect y="7.54" width="20" height="1.08" fill="#fff" />
              <rect y="9.69" width="20" height="1.08" fill="#fff" />
              <rect y="11.85" width="20" height="1.08" fill="#fff" />
              <rect width="8" height="7.54" fill="#3C3B6E" />
            </svg>
          }
          @case ('DE') {
            <svg viewBox="0 0 20 14">
              <rect width="20" height="4.67" fill="#000" />
              <rect y="4.67" width="20" height="4.67" fill="#DD0000" />
              <rect y="9.33" width="20" height="4.67" fill="#FFCE00" />
            </svg>
          }
          @case ('TH') {
            <svg viewBox="0 0 20 14">
              <rect width="20" height="14" fill="#A51931" />
              <rect y="2.33" width="20" height="9.33" fill="#F4F5F8" />
              <rect y="4.67" width="20" height="4.67" fill="#2D2A4A" />
            </svg>
          }
        }
      </span>
      <span class="language-label hidden sm:inline">{{ locale.currentOption.label }}</span>
      <mat-icon class="language-caret pointer-events-none" aria-hidden="true">expand_more</mat-icon>

      <select
        class="language-select"
        i18n-aria-label="Name of the language picker@@i18n.selector.ariaLabel"
        aria-label="Language"
        [disabled]="!locale.canSwitchLocale"
        (change)="onChange($event)"
      >
        @for (option of locale.options; track option.code) {
          <option
            [value]="option.code"
            [attr.lang]="option.regionTag"
            [attr.selected]="isCurrent(option.code)"
          >
            {{ option.label }}
          </option>
        }
      </select>
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    .language-selector {
      --ring: var(--mat-sys-outline);

      color: var(--mat-sys-on-surface);
      border-radius: var(--mat-sys-corner-full);
      background-color: color-mix(in srgb, var(--mat-sys-surface) 55%, transparent);
      // A shadow ring, not a border: a border would eat into the box the invisible
      // select fills edge-to-edge below ('inset: 0'), shrinking its 44px hit area.
      box-shadow:
        0 0 0 1px var(--ring),
        0 1px 2px color-mix(in srgb, var(--mat-sys-shadow) 8%, transparent);
      transition:
        background-color 0.2s ease,
        box-shadow 0.2s ease;

      &:hover {
        --ring: color-mix(in srgb, var(--mat-sys-primary) 35%, var(--mat-sys-outline));

        background-color: var(--mat-sys-surface);
      }

      &--disabled {
        opacity: 0.6;
      }
    }

    .language-flag {
      display: flex;
      flex: none;
      width: 1.25rem;
      height: 0.875rem;
      border-radius: 2px;
      overflow: hidden;
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--mat-sys-outline) 70%, transparent);

      svg {
        display: block;
        width: 100%;
        height: 100%;
      }
    }

    .language-label {
      font: var(--mat-sys-label-large);
      letter-spacing: 0.01em;
      white-space: nowrap;
    }

    .language-caret {
      color: var(--mat-sys-on-surface-variant);
      font-size: 1.125rem;
      width: 1.125rem;
      height: 1.125rem;
      transition: color 0.2s ease;
    }

    .language-selector:hover .language-caret {
      color: var(--mat-sys-on-surface);
    }

    // Layered exactly over the visible pill: real control on top, invisible, so its
    // focus ring, native picker and hit target are the ones a visitor actually gets.
    .language-select {
      position: absolute;
      inset: 0;
      width: 100%;
      appearance: none;
      background: transparent;
      border: 0;
      color: transparent;
      cursor: pointer;

      // The ring sits on the control itself, not on the pill around it: a focus
      // state has to be visible in the computed style of the focused element
      // (e2e/design.e2e.ts checks exactly that). The 'color: transparent' above hides
      // the native text without touching this — outline is never part of 'color'.
      &:focus-visible {
        outline: 2px solid var(--mat-sys-primary);
        outline-offset: 3px;
        border-radius: var(--mat-sys-corner-full);
      }

      &:disabled {
        cursor: not-allowed;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSelectorComponent {
  protected readonly locale = inject(LocaleService);

  /** `attr.selected`, not the property: it has to survive into the prerendered HTML. */
  protected isCurrent(code: SupportedLocale): '' | null {
    return code === this.locale.current ? '' : null;
  }

  /** The region subtag of an `xx-YY` tag — the half a flag actually belongs to. */
  protected countryOf(regionTag: string): string {
    return regionTag.split('-')[1] ?? regionTag;
  }

  protected onChange(event: Event): void {
    this.locale.switchTo((event.target as HTMLSelectElement).value as SupportedLocale);
  }
}
