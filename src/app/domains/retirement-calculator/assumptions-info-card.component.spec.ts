import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssumptionsInfoCardComponent } from './assumptions-info-card.component';

// Tailwind palette utilities are frozen to one hex value and ignore the theme
// toggle; themed colour must come from the `--mat-sys-*` tokens instead.
const PALETTE_CLASS =
  /^(?:(?:hover|focus|focus-visible|active|dark|sm|md|lg):)*(?:bg|text|border|ring|from|via|to)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:-\d{2,3})?(?:\/\d+)?$/;

const paletteClassesIn = (root: Element): string[] =>
  [root, ...root.querySelectorAll('*')].flatMap(el =>
    [...el.classList].filter(c => PALETTE_CLASS.test(c)),
  );

describe('AssumptionsInfoCardComponent', () => {
  let fixture: ComponentFixture<AssumptionsInfoCardComponent>;

  const host = () => fixture.nativeElement as HTMLElement;
  const statusChip = () => host().querySelector('.data-source-chip') as HTMLElement | null;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssumptionsInfoCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AssumptionsInfoCardComponent);
    fixture.detectChanges();
  });

  it('should create the card', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the assumptions the calculator was given', () => {
    fixture.componentRef.setInput('safeWithdrawalRate', 3.5);
    fixture.componentRef.setInput('estimatedAnnualReturn', 6);
    fixture.detectChanges();

    expect(host().textContent).toContain('3.5% Safe Withdrawal Rate');
    expect(host().textContent).toContain('6%');
  });

  // State is signalled by icon and label as well as tone, so the chip stays
  // readable for anyone who cannot separate the two hues.
  it('labels the data source rather than relying on colour alone', () => {
    fixture.componentRef.setInput('isLive', true);
    fixture.detectChanges();
    expect(statusChip()?.textContent).toContain('Live Economic Data');
    expect(statusChip()?.querySelector('mat-icon')).not.toBeNull();

    fixture.componentRef.setInput('isLive', false);
    fixture.detectChanges();
    expect(statusChip()?.textContent).toContain('Baseline Assumptions');
    expect(statusChip()?.querySelector('mat-icon')).not.toBeNull();
  });

  it('colours the card from theme tokens, not the Tailwind palette', () => {
    for (const isLive of [true, false]) {
      fixture.componentRef.setInput('isLive', isLive);
      fixture.detectChanges();

      expect(paletteClassesIn(host().querySelector('mat-card')!)).toEqual([]);
    }
  });
});
