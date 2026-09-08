import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdBannerComponent } from './ad-banner.component';

describe('AdBannerComponent', () => {
  let fixture: ComponentFixture<AdBannerComponent>;

  const slot = () =>
    (fixture.nativeElement as HTMLElement).querySelector('.ad-slot-frame') as HTMLElement | null;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdBannerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdBannerComponent);
    fixture.detectChanges();
  });

  it('should create the ad banner', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  // AdSense fills the <ins> asynchronously. Without a reserved box the ad drops
  // in and pushes everything below it down.
  it('reserves vertical space for the slot before the ad is filled', () => {
    expect(slot()?.classList.contains('min-h-24')).toBe(true);
  });

  // Turning ads off is a deliberate user action, so the reserved box collapses
  // with it rather than leaving a gap behind.
  it('collapses the reserved box entirely when the banner is hidden', () => {
    fixture.componentRef.setInput('visible', false);
    fixture.detectChanges();

    expect(slot()?.style.display).toBe('none');
  });
});
