import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { expect, it, describe, beforeEach, vi } from 'vitest';
import { ProfileComponent } from './profile.component';
import { ChatService } from '../chat/chat.service';
import { WORK_THEMES } from './profile.content';
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
      providers: [
        provideRouter([]),
        { provide: AdBannerService, useValue: mockAdBannerService },
        { provide: ChatService, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeDefined();
  });

  it('opens with the hero', () => {
    const page = (fixture.nativeElement as HTMLElement).querySelector('.profile-page');

    expect(page?.firstElementChild?.tagName).toBe('APP-PROFILE-HERO');
  });

  it('follows the hero with the "What I work on" themes', () => {
    const page = (fixture.nativeElement as HTMLElement).querySelector('.profile-page');

    expect(page?.children[1]?.tagName).toBe('APP-PROFILE-THEMES');
  });

  // The stack now lives inside the themes, in context; it no longer leads the page.
  it('no longer leads with a technology list', () => {
    const headings = [...(fixture.nativeElement as HTMLElement).querySelectorAll('h2')].map(h =>
      h.textContent?.trim(),
    );

    expect(headings).not.toContain('Technical Expertise');
  });

  // Owner's decision: the static page names the industry, never the companies.
  it('names no companies in its work themes', () => {
    const text = JSON.stringify(WORK_THEMES);

    expect(WORK_THEMES.length).toBeGreaterThanOrEqual(3);
    expect(WORK_THEMES.length).toBeLessThanOrEqual(4);
    expect(text).not.toMatch(/attempto|Atruvia|Fiducia|Genossenschaft/i);
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

  // CrashDash is access-restricted: the link lands on a sign-in wall, so the
  // card must say so before the visitor clicks.
  it('marks CrashDash as private and sign-in required', () => {
    const crashDash = projectLinks().find(
      link => link.getAttribute('href') === 'https://crashdash.singdee.de/',
    );
    const badge = crashDash?.querySelector('.project-access');

    expect(badge?.textContent?.trim()).toBe('Private — sign-in required');
  });

  it('shows no access badge on publicly usable projects', () => {
    const publicCards = projectLinks().filter(
      link => link.getAttribute('href') !== 'https://crashdash.singdee.de/',
    );

    expect(publicCards.length).toBeGreaterThan(0);
    for (const card of publicCards) {
      expect(card.querySelector('.project-access')).toBeNull();
    }
  });

  // Hover lift signals "clickable": only links may carry it, so static skill and
  // interest cards don't read as controls.
  it('gives the hover affordance to project links only', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const interactive = [...compiled.querySelectorAll('.card-interactive')];

    expect(interactive.length).toBe(component.sideProjects.length);
    for (const card of interactive) {
      expect(card.tagName).toBe('A');
    }
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

  it('should link to the BJJ Quiz with its description', () => {
    const bjjQuiz = projectLinks().find(
      link => link.getAttribute('href') === 'https://bjj-quiz.thanikc.workers.dev/',
    );

    expect(bjjQuiz).toBeDefined();
    expect(bjjQuiz!.textContent).toContain('BJJ Quiz');
    expect(bjjQuiz!.textContent).toContain('belt');
  });

  it('renders a "Beyond the Code" section with one card per interest', () => {
    const sections = [...(fixture.nativeElement as HTMLElement).querySelectorAll('section')];
    const interestsSection = sections.find(section =>
      section.querySelector('h2')?.textContent?.includes('Beyond the Code'),
    );

    expect(interestsSection).toBeDefined();
    expect(component.interests.length).toBeGreaterThan(0);
    expect(interestsSection!.querySelectorAll('.interest-card').length).toBe(
      component.interests.length,
    );
  });

  it('covers swimming, bouldering, chess and Mandarin in the interests', () => {
    const text = component.interests
      .map(interest => `${interest.name} ${interest.description}`)
      .join(' ')
      .toLowerCase();

    expect(text).toContain('swim');
    expect(text).toContain('boulder');
    expect(text).toContain('chess');
    expect(text).toContain('mandarin');
  });

  it('places the interests section before the side projects section', () => {
    const sections = [...(fixture.nativeElement as HTMLElement).querySelectorAll('section')];
    const interestsIdx = sections.findIndex(section =>
      section.textContent?.includes('Beyond the Code'),
    );
    const sideProjectsIdx = sections.findIndex(section =>
      section.textContent?.includes('Side Projects'),
    );

    expect(interestsIdx).toBeGreaterThanOrEqual(0);
    expect(interestsIdx).toBeLessThan(sideProjectsIdx);
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
    const page = compiled.querySelector('.profile-page');
    const adSlot = compiled.querySelector('.ad-slot');

    expect(page?.classList.contains('flex-1')).toBe(true);
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

  // <main> already applies the page container, gutters and max width; repeating
  // them here inset the content twice and pinned it to a narrower column.
  it('does not repeat the page gutters already applied by <main>', () => {
    const page = (fixture.nativeElement as HTMLElement).querySelector('.profile-page');

    expect(page?.classList.contains('container')).toBe(false);
    expect(page?.classList.contains('px-4')).toBe(false);
    expect(page?.classList.contains('max-w-5xl')).toBe(false);
  });
});
