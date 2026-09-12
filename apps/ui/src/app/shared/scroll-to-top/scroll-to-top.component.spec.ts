import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ScrollToTopComponent } from './scroll-to-top.component';
import { CookieConsentService } from '../cookie-consent/cookie-consent.service';

describe('ScrollToTopComponent', () => {
  let fixture: ComponentFixture<ScrollToTopComponent>;
  const showBanner = signal(false);

  const setScrollY = (value: number): void => {
    Object.defineProperty(window, 'scrollY', { value, configurable: true });
  };

  const scroll = async (value: number): Promise<void> => {
    setScrollY(value);
    window.dispatchEvent(new Event('scroll'));
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const button = (): HTMLButtonElement | null =>
    (fixture.nativeElement as HTMLElement).querySelector('button');

  beforeEach(async () => {
    showBanner.set(false);
    setScrollY(0);

    await TestBed.configureTestingModule({
      imports: [ScrollToTopComponent],
      providers: [{ provide: CookieConsentService, useValue: { showBanner } }],
    }).compileComponents();

    fixture = TestBed.createComponent(ScrollToTopComponent);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    setScrollY(0);
  });

  it('should create the component', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should stay hidden while the page is at the top', () => {
    expect(button()).toBeNull();
  });

  it('should appear once the page scrolls past the threshold', async () => {
    await scroll(500);

    const el = button();
    expect(el).not.toBeNull();
    expect(el?.getAttribute('aria-label')).toBe('Scroll to top');
  });

  it('should hide again when scrolling back up above the threshold', async () => {
    await scroll(500);
    await scroll(0);

    expect(button()).toBeNull();
  });

  it('should stay hidden while the cookie consent banner is showing, even past the threshold', async () => {
    showBanner.set(true);
    await scroll(500);

    expect(button()).toBeNull();
  });

  it('should scroll the window to the top when clicked', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    await scroll(500);

    button()!.click();

    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0, left: 0 }));
  });
});
