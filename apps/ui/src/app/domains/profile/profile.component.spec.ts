import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { expect, it, describe, beforeEach, vi } from 'vitest';
import { ProfileComponent } from './profile.component';
import { ChatService } from '../chat/chat.service';
import { PRINCIPLES, PROJECTS, TOOLBOX, WORK_THEMES } from './profile.content';
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

    // AI Ling is part of the portfolio story: its card shows the mechanism.
    it('shows how AI Ling works as a four-step flow through retrieval and the providers', () => {
      const flow = project('AI Ling').flow ?? [];

      expect(flow).toHaveLength(4);
      expect(JSON.stringify(flow)).toContain('Vectorize');
      expect(JSON.stringify(flow)).toContain('Groq');
      expect(PROJECTS.filter(p => p.flow).map(p => p.name)).toEqual(['AI Ling']);
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

  // Personality stays, but after the professional story: interests close the page.
  it('closes with the interests, after the toolbox and before the ad slot', () => {
    const interests = el().querySelector('app-profile-interests');
    const toolbox = el().querySelector('app-profile-toolbox')!;

    expect(interests).not.toBeNull();
    expect(
      toolbox.compareDocumentPosition(interests!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(interests?.nextElementSibling?.classList.contains('ad-slot')).toBe(true);
  });

  it('keeps each interest to one short line', () => {
    for (const interest of component.interests) {
      expect(interest.description.length).toBeLessThanOrEqual(90);
    }
  });

  describe('how I work', () => {
    it('follows the projects with the principles', () => {
      const principles = el().querySelector('app-profile-principles');

      expect(principles).not.toBeNull();
      expect(
        projectsHost()!.compareDocumentPosition(principles!) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    // Concise on purpose: four habits, each pointing at checkable evidence.
    it('keeps four principles, each with evidence', () => {
      expect(PRINCIPLES).toHaveLength(4);
      for (const principle of PRINCIPLES) {
        expect(principle.evidence.label.length).toBeGreaterThan(0);
      }
    });

    it('links evidence only to the public repository', () => {
      const urls = PRINCIPLES.flatMap(p => (p.evidence.kind === 'link' ? [p.evidence.url] : []));

      expect(urls.length).toBeGreaterThan(0);
      for (const url of urls) {
        expect(url.startsWith('https://github.com/thanikc/thanikc.github.io/')).toBe(true);
      }
    });

    // The no-streaming story is principle 4's evidence; the page shouldn't tell it twice.
    it('tells the no-streaming story once, as a principle', () => {
      expect(project('AI Ling').decision).not.toMatch(/stream/i);
      expect(JSON.stringify(PRINCIPLES)).toMatch(/stream/i);
    });

    it('names no companies', () => {
      expect(JSON.stringify(PRINCIPLES)).not.toMatch(COMPANIES);
    });
  });

  describe('toolbox', () => {
    it('follows the principles with the toolbox', () => {
      const principles = el().querySelector('app-profile-principles')!;
      const toolbox = el().querySelector('app-profile-toolbox');

      expect(toolbox).not.toBeNull();
      expect(
        principles.compareDocumentPosition(toolbox!) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    const toolsIn = (group: string) => TOOLBOX.find(g => g.name === group)?.tools ?? [];
    const dailyTools = () =>
      TOOLBOX.filter(g => g.name !== 'Also worked with').flatMap(g => g.tools);

    // Q11: Nx, NestJS and Helm are daily; plain Kubernetes is familiar, not daily.
    it('lists the daily tools in their groups and Kubernetes only as also-worked-with', () => {
      expect(dailyTools()).toEqual(expect.arrayContaining(['Nx', 'NestJS', 'Helm', 'OpenShift']));
      expect(dailyTools()).not.toContain('Kubernetes');
      expect(toolsIn('Also worked with')).toContain('Kubernetes');
    });

    it('covers frontend, backend, platform, quality and AI-assisted engineering', () => {
      expect(TOOLBOX.map(g => g.name)).toEqual([
        'Frontend',
        'Backend',
        'Platform & delivery',
        'Quality',
        'AI-assisted engineering',
        'Also worked with',
      ]);
    });
  });

  it('renders a labeled ad slot as the last element of the page', () => {
    const page = el().querySelector('.profile-page');
    const adSlot = el().querySelector('.ad-slot');

    expect(page?.lastElementChild).toBe(adSlot);
    expect(adSlot?.textContent).toContain('Advertisement');
    expect(adSlot?.querySelector('app-ad-banner')).not.toBeNull();
  });

  it('pins the ad slot to the bottom of the page above the footer', () => {
    const page = el().querySelector('.profile-page');
    const adSlot = el().querySelector('.ad-slot');

    expect(page?.classList.contains('flex-1')).toBe(true);
    expect(adSlot?.classList.contains('mt-auto')).toBe(true);
  });

  it('keeps at least a 2rem gap between the last section and the ad slot', () => {
    // mb-8 = 2rem, applied as a fixed margin so it survives even when the
    // ad slot's mt-auto collapses to 0 on a short page.
    const lastSection = el().querySelector('.ad-slot')?.previousElementSibling;

    expect(lastSection?.classList.contains('mb-8')).toBe(true);
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
