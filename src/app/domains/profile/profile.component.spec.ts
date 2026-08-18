import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { expect, it, describe, beforeEach } from 'vitest';
import { ProfileComponent } from './profile.component';
import { AdBannerService } from '../ads/ad-banner.service';
import { AdBannerComponent } from '../ads/ad-banner.component';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  const projectLinks = () => [
    ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('.project-card'),
  ];

  const mockShowBanner = signal(true);
  const mockRouteAllowsAds = signal(true);
  const mockAdBannerService = {
    showBanner: mockShowBanner,
    routeAllowsAds: mockRouteAllowsAds,
  };

  beforeEach(async () => {
    mockShowBanner.set(true);
    mockRouteAllowsAds.set(true);

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [provideRouter([]), { provide: AdBannerService, useValue: mockAdBannerService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeDefined();
  });

  it('should render the intro paragraph in the hero section', () => {
    const intro = (fixture.nativeElement as HTMLElement).querySelector('.hero-intro');

    expect(intro).not.toBeNull();
    expect(intro!.textContent?.trim()).toBe(component.intro);
    expect(component.intro.length).toBeGreaterThan(0);
  });

  it('should render one card per configured side project', () => {
    expect(projectLinks().length).toBe(component.sideProjects.length);
    expect(projectLinks().map(link => link.getAttribute('href'))).toEqual(
      component.sideProjects.map(project => project.url),
    );
  });

  it('should link to CrashDash with its description', () => {
    const crashDash = projectLinks().find(
      link => link.getAttribute('href') === 'https://crashdash.singdee.de/',
    );

    expect(crashDash).toBeDefined();
    expect(crashDash!.textContent).toContain('CrashDash');
    expect(crashDash!.textContent).toContain('market crash');
  });

  it('should open external project links safely in a new tab', () => {
    const externalLinks = projectLinks().filter(link =>
      link.getAttribute('href')?.startsWith('http'),
    );

    expect(externalLinks.length).toBeGreaterThan(0);
    for (const link of externalLinks) {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    }
  });

  it('should link to the Retirement Calculator as an in-app route', () => {
    const calculatorLink = projectLinks().find(link => link.getAttribute('href') === '/calculator');

    expect(calculatorLink).toBeDefined();
    expect(calculatorLink!.textContent).toContain('Retirement Calculator');
    expect(calculatorLink!.getAttribute('target')).toBeNull();
  });

  it('renders a labeled ad slot directly after the side projects section', () => {
    const sections = [...(fixture.nativeElement as HTMLElement).querySelectorAll('section')];
    const sideProjectsSection = sections.find(section =>
      section.textContent?.includes('Side Projects'),
    );
    const adSlot = sideProjectsSection?.nextElementSibling;

    expect(adSlot?.classList.contains('ad-slot')).toBe(true);
    expect(adSlot?.textContent).toContain('Advertisement');
    expect(adSlot?.querySelector('app-ad-banner')).not.toBeNull();
  });

  it('pins the ad slot to the bottom of the page above the footer', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const container = compiled.querySelector('.container');
    const adSlot = compiled.querySelector('.ad-slot');

    expect(container?.classList.contains('flex-1')).toBe(true);
    expect(adSlot?.classList.contains('mt-auto')).toBe(true);
  });

  it('keeps at least a 2rem gap between the side projects section and the ad slot', () => {
    const sections = [...(fixture.nativeElement as HTMLElement).querySelectorAll('section')];
    const sideProjectsSection = sections.find(section =>
      section.textContent?.includes('Side Projects'),
    );

    // mb-8 = 2rem, applied as a fixed margin so it survives even when the
    // ad slot's mt-auto collapses to 0 on a short page.
    expect(sideProjectsSection?.classList.contains('mb-8')).toBe(true);
  });

  it('should display the ad banner when showBanner signal is true', () => {
    const bannerComponent = fixture.debugElement.query(
      By.directive(AdBannerComponent),
    ).componentInstance;

    expect(bannerComponent.visible()).toBe(true);
  });

  it('should hide the ad banner when showBanner signal becomes false', () => {
    mockShowBanner.set(false);
    fixture.detectChanges();

    const bannerComponent = fixture.debugElement.query(
      By.directive(AdBannerComponent),
    ).componentInstance;

    expect(bannerComponent.visible()).toBe(false);
  });

  it('hides the ad banner on routes that disallow ads regardless of user preference', () => {
    mockRouteAllowsAds.set(false);
    fixture.detectChanges();

    const bannerComponent = fixture.debugElement.query(
      By.directive(AdBannerComponent),
    ).componentInstance;

    expect(bannerComponent.visible()).toBe(false);
  });
});
