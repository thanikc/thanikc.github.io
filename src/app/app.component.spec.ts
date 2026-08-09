import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { AdBannerService } from './domains/ads/ad-banner.service';
import { AdBannerComponent } from './domains/ads/ad-banner.component';
import { NavigationEnd, provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { Subject } from 'rxjs';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  const mockShowBanner = signal(true);
  const mockAdBannerService = {
    showBanner: mockShowBanner,
  };

  afterEach(() => {
    delete (window as any).gtag;
  });

  beforeEach(async () => {
    mockShowBanner.set(true);

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), { provide: AdBannerService, useValue: mockAdBannerService }],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app shell', () => {
    expect(component).toBeTruthy();
  });

  it('should render the header component', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-header')).not.toBeNull();
  });

  it('should contain a main router outlet for lazy loaded views', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });

  it('should display the ad banner when showBanner signal is true', () => {
    const bannerComponent = fixture.debugElement.query(
      By.directive(AdBannerComponent),
    ).componentInstance;

    expect(bannerComponent.visible()).toBe(true);
  });

  it('should remove the ad banner from the DOM when showBanner signal becomes false', () => {
    mockShowBanner.set(false);

    fixture.detectChanges();

    const bannerComponent = fixture.debugElement.query(
      By.directive(AdBannerComponent),
    ).componentInstance;

    expect(bannerComponent.visible()).toBe(false);
  });

  it('should send a gtag page_view event on navigation end', async () => {
    (window as any).gtag = vi.fn();

    fixture.detectChanges();

    const router = TestBed.inject(Router);
    const events = router.events as unknown as Subject<NavigationEnd>;
    events.next(new NavigationEnd(1, '/', '/'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect((window as any).gtag).toHaveBeenCalledWith(
      'event',
      'page_view',
      expect.objectContaining({
        page_title: document.title,
        page_path: '/',
        page_location: window.location.origin + '/',
      }),
    );
  });
});
