import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { expect, it, describe, beforeEach, vi } from 'vitest';
import { ProfileComponent } from './profile.component';
import { ChatService } from '../chat/chat.service';
import { PROJECTS, WORK_THEMES } from './profile.content';
import { AdBannerService } from '../ads/ad-banner.service';
import { AdBannerComponent } from '../ads/ad-banner.component';

const COMPANIES = /attempto|Atruvia|Fiducia|Genossenschaft/i;

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  const el = () => fixture.nativeElement as HTMLElement;
  const projectsHost = () => el().querySelector('app-profile-projects');
  const project = (name: string) => PROJECTS.find(candidate => candidate.name === name)!;

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
    const page = el().querySelector('.profile-page');

    expect(page?.firstElementChild?.tagName).toBe('APP-PROFILE-HERO');
  });

  it('follows the hero with the "What I work on" themes', () => {
    const page = el().querySelector('.profile-page');

    expect(page?.children[1]?.tagName).toBe('APP-PROFILE-THEMES');
  });

  // The stack now lives inside the themes, in context; it no longer leads the page.
  it('no longer leads with a technology list', () => {
    const headings = [...el().querySelectorAll('h2')].map(h => h.textContent?.trim());

    expect(headings).not.toContain('Technical Expertise');
  });

  // Owner's decision: the static page names the industry, never the companies.
  it('names no companies in its work themes', () => {
    expect(WORK_THEMES.length).toBeGreaterThanOrEqual(3);
    expect(WORK_THEMES.length).toBeLessThanOrEqual(4);
    expect(JSON.stringify(WORK_THEMES)).not.toMatch(COMPANIES);
  });

  describe('projects', () => {
    it('renders every project', () => {
      expect(projectsHost()?.querySelectorAll('app-project-card')).toHaveLength(PROJECTS.length);
    });

    // CrashDash and AI Ling are the strongest evidence; the small tools follow.
    it('features CrashDash and AI Ling, then the quiz and the calculator', () => {
      expect(PROJECTS.map(p => p.name)).toEqual([
        'CrashDash',
        'AI Ling',
        'BJJ Quiz',
        'Retirement Calculator',
      ]);
      expect(PROJECTS.filter(p => p.featured).map(p => p.name)).toEqual(['CrashDash', 'AI Ling']);
    });

    // CrashDash is access-restricted: its link lands on a sign-in wall, so the
    // card says so before the visitor clicks.
    it('marks CrashDash as private and sign-in required, and still links to it', () => {
      expect(project('CrashDash').status.label).toBe('Private — sign-in required');
      expect(project('CrashDash').primary?.url).toBe('https://crashdash.singdee.de/');
      expect(project('CrashDash').tagline).toContain('market crash');
    });

    it('links the BJJ Quiz externally and the calculator in-app', () => {
      expect(project('BJJ Quiz').primary).toEqual(
        expect.objectContaining({ url: 'https://bjj-quiz.thanikc.workers.dev/', external: true }),
      );
      expect(project('Retirement Calculator').primary).toEqual(
        expect.objectContaining({ url: '/calculator', external: false }),
      );
    });

    // AI Ling is the page's own AI application: its source is the public repo.
    it('points AI Ling at its public source', () => {
      expect(project('AI Ling').source?.url).toBe(
        'https://github.com/thanikc/thanikc.github.io/tree/main/apps/worker',
      );
    });

    // Private sources (Q7, Q8): no source links for CrashDash or the quiz.
    it('links no private source code', () => {
      expect(project('CrashDash').source).toBeUndefined();
      expect(project('BJJ Quiz').source).toBeUndefined();
    });

    it('gives every project a hook question and names no companies', () => {
      for (const p of PROJECTS) {
        expect(p.question.length).toBeGreaterThan(0);
      }
      expect(JSON.stringify(PROJECTS)).not.toMatch(COMPANIES);
    });
  });

  it('renders a "Beyond the Code" section with one card per interest', () => {
    const sections = [...el().querySelectorAll('section')];
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

  it('places the interests section before the projects', () => {
    const interests = [...el().querySelectorAll('section')].find(section =>
      section.textContent?.includes('Beyond the Code'),
    )!;

    expect(
      interests.compareDocumentPosition(projectsHost()!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('renders a labeled ad slot directly after the projects', () => {
    const adSlot = projectsHost()?.nextElementSibling;

    expect(adSlot?.classList.contains('ad-slot')).toBe(true);
    expect(adSlot?.textContent).toContain('Advertisement');
    expect(adSlot?.querySelector('app-ad-banner')).not.toBeNull();
  });

  it('pins the ad slot to the bottom of the page above the footer', () => {
    const page = el().querySelector('.profile-page');
    const adSlot = el().querySelector('.ad-slot');

    expect(page?.classList.contains('flex-1')).toBe(true);
    expect(adSlot?.classList.contains('mt-auto')).toBe(true);
  });

  it('keeps at least a 2rem gap between the projects and the ad slot', () => {
    // mb-8 = 2rem, applied as a fixed margin so it survives even when the
    // ad slot's mt-auto collapses to 0 on a short page.
    expect(projectsHost()?.classList.contains('mb-8')).toBe(true);
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
    const page = el().querySelector('.profile-page');

    expect(page?.classList.contains('container')).toBe(false);
    expect(page?.classList.contains('px-4')).toBe(false);
    expect(page?.classList.contains('max-w-5xl')).toBe(false);
  });
});
