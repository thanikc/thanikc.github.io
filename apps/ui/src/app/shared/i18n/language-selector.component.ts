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
 * popup, not the always-visible flag and label this is really about.
 *
 * A native `<select>`, not `MatSelect`: `@angular/cdk/overlay` is unusable in this
 * app (documented on `chat-widget.component.ts` — the CLI cache is off, and the
 * overlay's circular imports then break the dev server), and `MatSelect` is built on
 * it. The platform control also gets the phone's own language wheel and full
 * keyboard support for free, which is the better trade here anyway.
 *
 * The flag, label and caret you see are plain content, not a styled `<select>`: the
 * real `<select>` sits on top of them, sized to match exactly, with its own text made
 * transparent so the OS still draws its focus ring, its native picker and its hit
 * target, while what a visitor actually reads is the content underneath. No background
 * or border on the group itself, on purpose — it reads as part of the header, the way
 * the nav links next to it do, rather than as a boxed control.
 */
@Component({
  selector: 'app-language-selector',
  imports: [MatIconModule],
  templateUrl: './language-selector.component.html',
  styleUrl: './language-selector.component.scss',
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
