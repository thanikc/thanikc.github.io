import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { CookieConsentBannerComponent } from './cookie-consent-banner.component';
import { CookieConsentService } from './cookie-consent.service';

describe('CookieConsentBannerComponent', () => {
  let component: CookieConsentBannerComponent;
  let fixture: ComponentFixture<CookieConsentBannerComponent>;

  const mockShowBanner = signal(true);
  const mockCookieConsentService = {
    showBanner: mockShowBanner,
    accept: vi.fn(),
    reject: vi.fn(),
  };

  beforeEach(async () => {
    mockShowBanner.set(true);
    mockCookieConsentService.accept.mockClear();
    mockCookieConsentService.reject.mockClear();

    await TestBed.configureTestingModule({
      imports: [CookieConsentBannerComponent],
      providers: [{ provide: CookieConsentService, useValue: mockCookieConsentService }],
    }).compileComponents();

    fixture = TestBed.createComponent(CookieConsentBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the banner when showBanner is true', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('hides the banner when showBanner is false', () => {
    mockShowBanner.set(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('[role="dialog"]')).toBeNull();
  });

  it('calls accept() on the service when the Accept button is clicked', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('button');

    buttons[1].click();

    expect(mockCookieConsentService.accept).toHaveBeenCalled();
  });

  it('calls reject() on the service when the Reject button is clicked', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('button');

    buttons[0].click();

    expect(mockCookieConsentService.reject).toHaveBeenCalled();
  });
});
