import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { LanguageSelectorComponent } from './language-selector.component';
import { LocaleService } from './locale.service';
import { LOCALE_OPTIONS, SupportedLocale } from './locales';

describe('LanguageSelectorComponent', () => {
  let fixture: ComponentFixture<LanguageSelectorComponent>;
  let switchTo: ReturnType<typeof vi.fn>;

  async function setup(current: SupportedLocale = 'en', canSwitchLocale = true): Promise<void> {
    switchTo = vi.fn();
    await TestBed.configureTestingModule({
      imports: [LanguageSelectorComponent],
      providers: [
        {
          provide: LocaleService,
          useValue: {
            current,
            options: LOCALE_OPTIONS,
            currentOption: LOCALE_OPTIONS.find(option => option.code === current),
            canSwitchLocale,
            switchTo,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageSelectorComponent);
    fixture.detectChanges();
  }

  const select = (): HTMLSelectElement =>
    (fixture.nativeElement as HTMLElement).querySelector('select')!;
  const pill = (): HTMLElement =>
    (fixture.nativeElement as HTMLElement).querySelector('.language-selector')!;

  afterEach(() => TestBed.resetTestingModule());

  // A native select, on purpose: @angular/cdk/overlay is unusable in this app
  // (see the docblock), and the platform control is accessible for free.
  it('offers every language the site is built in, named in its own language', async () => {
    await setup();

    expect([...select().options].map(option => option.value)).toEqual(['en', 'de', 'th']);
    expect([...select().options].map(option => option.textContent?.trim())).toEqual([
      'English',
      'Deutsch',
      'ไทย',
    ]);
  });

  it('tags each option with its language-region tag, for assistive tech', async () => {
    await setup();

    expect([...select().options].map(option => option.lang)).toEqual(['en-US', 'de-DE', 'th-TH']);
  });

  it('draws the active language’s flag as its own SVG, not a font glyph, and shows its label alongside on a wide-enough screen', async () => {
    await setup('de');

    expect(pill().querySelector('.language-flag svg')).toBeTruthy();
    expect(pill().querySelector('.language-label')?.textContent).toBe('Deutsch');
    expect(pill().querySelector('.language-label')?.classList.contains('hidden')).toBe(true);
  });

  it('shows the active language as the selected one', async () => {
    await setup('de');

    expect(select().value).toBe('de');
  });

  it('switches language when another one is picked', async () => {
    await setup('en');

    select().value = 'th';
    select().dispatchEvent(new Event('change'));

    expect(switchTo).toHaveBeenCalledWith('th');
  });

  it('names the control for screen readers', async () => {
    await setup();

    expect(select().getAttribute('aria-label')).toBe('Language');
  });

  it('gives the control a 44px hit area', async () => {
    await setup();

    // The select is layered exactly over this pill (`position: absolute; inset: 0`
    // in the component styles), so the pill's own height is its real hit area.
    expect(pill().classList.contains('h-11')).toBe(true);
  });

  it('disables the control when the build cannot switch languages', async () => {
    await setup('en', false);

    expect(select().disabled).toBe(true);
  });

  it('enables the control when the build can switch languages', async () => {
    await setup('en', true);

    expect(select().disabled).toBe(false);
  });
});
