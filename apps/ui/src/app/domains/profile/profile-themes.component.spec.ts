import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import * as THREE from 'three';
import { ProfileThemesComponent } from './profile-themes.component';
import { WorkTheme } from './profile.content';
import { AskLingLinkComponent } from '../chat/ask-ling-link.component';
import { ChatService } from '../chat/chat.service';
import { WEBGL_RENDERER_FACTORY } from '../../shared/scroll-scene/scroll-scene.component';
import { paletteClassesIn } from '../../shared/testing/palette-classes';

const THEMES: WorkTheme[] = [
  {
    title: 'Large front ends',
    summary: 'Portals many teams build on.',
    chips: ['Angular', 'Web Components'],
    hookLabel: 'Ask what “large” means',
    question: 'What is the largest front end Thanik has worked on?',
  },
  {
    title: 'AI in a team',
    summary: 'Making AI output meet the team standard.',
    chips: ['TDD'],
    hookLabel: 'Ask how he uses AI',
    question: 'How does Thanik use AI in a team?',
  },
];

const stubRenderer = {
  render: vi.fn(),
  dispose: vi.fn(),
  setSize: vi.fn(),
  setPixelRatio: vi.fn(),
} as unknown as THREE.WebGLRenderer;

describe('ProfileThemesComponent', () => {
  let fixture: ComponentFixture<ProfileThemesComponent>;

  const el = () => fixture.nativeElement as HTMLElement;
  const panels = () => [...el().querySelectorAll<HTMLElement>('.theme-panel')];

  const render = (themes: WorkTheme[]) => {
    fixture.componentRef.setInput('themes', themes);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileThemesComponent],
      providers: [
        { provide: ChatService, useValue: { open: vi.fn() } },
        { provide: WEBGL_RENDERER_FACTORY, useValue: () => stubRenderer },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileThemesComponent);
    render(THEMES);
  });

  // The header on the page background above a coloured band read as a stray caption.
  it('is one band: the section carries the fill and the header sits inside it', () => {
    const band = el().querySelector('section.theme-section');

    expect(band).not.toBeNull();
    expect(band?.querySelector('app-section-header')).not.toBeNull();
  });

  it('is a section labelled by its headline', () => {
    const section = el().querySelector('section');
    const labelId = section?.getAttribute('aria-labelledby');

    expect(labelId).toBeTruthy();
    expect(el().querySelector(`#${labelId}`)?.textContent?.trim()).toBe(
      'The kinds of problems I spend my days on',
    );
  });

  it('renders one full-bleed panel per theme with its title and summary', () => {
    expect(panels()).toHaveLength(2);
    expect(panels()[0].querySelector('h3')?.textContent?.trim()).toBe('Large front ends');
    expect(panels()[0].textContent).toContain('Portals many teams build on.');
  });

  // Eyebrow numbering, one per section — 01., 02., ... 0N.
  it('numbers each panel 01., 02., …, matching the theme count', () => {
    const counters = panels().map(p => p.querySelector('.theme-counter')?.textContent?.trim());

    expect(counters).toEqual(['01.', '02.']);
  });

  // The stack appears once, in context, instead of as a separate list up front.
  it('lists each theme’s technologies as chips', () => {
    const chips = [...panels()[0].querySelectorAll('li.theme-chip')].map(c =>
      c.textContent?.trim(),
    );

    expect(chips).toEqual(['Angular', 'Web Components']);
  });

  // Curiosity hook: the card states the narrative, AI Ling supplies the depth.
  it('ends each panel with an Ask AI Ling hook carrying that theme’s question', () => {
    const hooks = fixture.debugElement
      .queryAll(By.directive(AskLingLinkComponent))
      .map(hook => hook.componentInstance as AskLingLinkComponent);

    expect(hooks.map(hook => hook.question())).toEqual(THEMES.map(theme => theme.question));
    expect(hooks.map(hook => hook.label())).toEqual(THEMES.map(theme => theme.hookLabel));
  });

  it('shows an empty state when there are no themes', () => {
    render([]);

    expect(panels()).toHaveLength(0);
    expect(el().textContent).toContain('Nothing to show yet.');
  });

  it('colours itself from theme tokens, not the Tailwind palette', () => {
    expect(paletteClassesIn(el())).toEqual([]);
  });

  // Side progress dots, driven off each scene's own progress
  // output rather than a second scroll listener.
  describe('progress dots', () => {
    it('renders one dot per theme', () => {
      const dots = el().querySelectorAll('.theme-dot');

      expect(dots).toHaveLength(2);
    });

    it('defaults to the first dot active before any scene reports progress', () => {
      const dots = [...el().querySelectorAll('.theme-dot')];

      expect(dots[0].classList.contains('active')).toBe(true);
      expect(dots[1].classList.contains('active')).toBe(false);
    });

    it('activates the last theme whose scene has started, as progress comes in', () => {
      fixture.componentInstance['onSceneProgress'](0, 1);
      fixture.componentInstance['onSceneProgress'](1, 0.4);
      fixture.detectChanges();

      const dots = [...el().querySelectorAll('.theme-dot')];
      expect(dots[0].classList.contains('active')).toBe(false);
      expect(dots[1].classList.contains('active')).toBe(true);
    });

    // Visibility is driven by an IntersectionObserver on the whole panels
    // block, not derived from individual scenes' progress: a theme whose
    // `@defer` never mounted (scrolled past too fast to trigger `on
    // viewport`) would otherwise leave its progress stuck at 0 forever,
    // permanently blocking the "every theme finished" check from ever
    // being true again — found while visually verifying this phase.
    it('shows only while the panels block itself is in the viewport', () => {
      const dotsContainer = () => el().querySelector('.theme-progress');

      expect(dotsContainer()?.classList.contains('visible')).toBe(false);

      fixture.componentInstance['onPanelsVisibilityChange'](true);
      fixture.detectChanges();
      expect(dotsContainer()?.classList.contains('visible')).toBe(true);

      fixture.componentInstance['onPanelsVisibilityChange'](false);
      fixture.detectChanges();
      expect(dotsContainer()?.classList.contains('visible')).toBe(false);
    });
  });
});
