import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeferBlockBehavior, DeferBlockState } from '@angular/core/testing';
import { vi } from 'vitest';
import * as THREE from 'three';
import { ProfileHeroComponent } from './profile-hero.component';
import { ChatService } from '../chat/chat.service';
import { paletteClassesIn } from '../../shared/testing/palette-classes';
import { WEBGL_RENDERER_FACTORY } from '../../shared/scroll-scene/scroll-scene.component';

// jsdom's canvas has no real WebGL context; the scroll scene is only checked
// structurally here (see WEBGL_RENDERER_FACTORY's own doc comment) — visuals
// are a Playwright concern, not a Vitest one.
const stubRenderer = {
  render: vi.fn(),
  dispose: vi.fn(),
  setSize: vi.fn(),
  setPixelRatio: vi.fn(),
} as unknown as THREE.WebGLRenderer;

const ASK_LING_PROMPTS: readonly string[] = [
  "What's the most complex system Thanik has worked on?",
  'What has Thanik built from scratch?',
];

describe('ProfileHeroComponent', () => {
  let fixture: ComponentFixture<ProfileHeroComponent>;

  const el = () => fixture.nativeElement as HTMLElement;
  const text = () => el().textContent?.replace(/\s+/g, ' ') ?? '';
  const linkTo = (href: string) =>
    [...el().querySelectorAll<HTMLAnchorElement>('a')].find(a => a.getAttribute('href') === href);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileHeroComponent],
      providers: [
        { provide: ChatService, useValue: { open: vi.fn() } },
        { provide: WEBGL_RENDERER_FACTORY, useValue: () => stubRenderer },
      ],
      deferBlockBehavior: DeferBlockBehavior.Manual,
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileHeroComponent);
    fixture.componentRef.setInput('askLingPrompts', ASK_LING_PROMPTS);
    fixture.detectChanges();
  });

  it('names the role and the person, with the name as the only h1', () => {
    expect(el().querySelector('.hero-badge')?.textContent?.trim()).toBe(
      'Senior Full-Stack Engineer',
    );
    expect(el().querySelectorAll('h1')).toHaveLength(1);
    expect(el().querySelector('h1')?.textContent?.trim()).toBe('Thanik Cheowtirakul');
  });

  // Positioning, not a technology string: what he builds, for whom, and how AI fits.
  it('states the positioning in one sentence', () => {
    const positioning = el().querySelector('.hero-positioning')?.textContent ?? '';

    expect(positioning).toContain('Angular and Spring Boot');
    expect(positioning).toContain('German online banking');
    expect(positioning).toContain('AI');
    expect(positioning).toContain('changing the way we build serious software');
  });

  // Owner's decisions: industry only, no company names, no credential line.
  it('names no companies and carries no years-of-experience line', () => {
    expect(text()).not.toMatch(/attempto|Atruvia|Fiducia|Genossenschaft/i);
    expect(text()).not.toMatch(/\d+\+? years/i);
  });

  it('drops the repeated technology subtitle', () => {
    expect(text()).not.toContain('OpenShift Solutions');
  });

  // Redesign: the Ask AI Ling pitch was its own boxed card
  // right below the hero; that card is gone and its content now lives here,
  // alongside the Email/LinkedIn CTAs — one continuous "who I am, talk to me
  // two ways" block instead of a hero followed immediately by another card.
  it('invites AI Ling exploration alongside the CTAs, one hook per prompt', () => {
    expect(text()).toContain('Ask AI Ling');

    const hooks = [...el().querySelectorAll('app-ask-ling-link')];
    expect(hooks).toHaveLength(ASK_LING_PROMPTS.length);
  });

  it('offers Email and LinkedIn as its actions', () => {
    const email = linkTo('mailto:thanikc@gmail.com');
    const linkedIn = linkTo('https://de.linkedin.com/in/thanik-cheowtirakul-7a259526');

    expect(email?.textContent?.trim()).toBe('Email');
    expect(email?.getAttribute('target')).toBeNull();
    expect(email?.getAttribute('data-cta-tracking')).toBe('Hero: Email');

    expect(linkedIn?.textContent?.trim()).toBe('LinkedIn');
    expect(linkedIn?.getAttribute('target')).toBe('_blank');
    expect(linkedIn?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(linkedIn?.getAttribute('data-cta-tracking')).toBe('Hero: LinkedIn');

    for (const link of [email!, linkedIn!]) {
      expect(link.classList.contains('mat-mdc-outlined-button')).toBe(true);
      expect(link.classList.contains('min-h-11')).toBe(true);
      const icon = link.querySelector('svg');
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
      expect(icon?.querySelector('path')?.getAttribute('d')?.length).toBeGreaterThan(0);
    }
  });

  it('colours itself from theme tokens, not the Tailwind palette', () => {
    expect(paletteClassesIn(el())).toEqual([]);
  });

  // Redesign: full-bleed dark section, not a raised card —
  // e2e/design.e2e.ts's surfaceSeparation() only checks selectors that read as
  // a "card"; this section deliberately isn't one, hence the renamed root class.
  describe('full-bleed section', () => {
    it('is a full-bleed section, not a bordered card', () => {
      expect(el().querySelector('.hero-section')).not.toBeNull();
      expect(el().querySelector('.hero-card')).toBeNull();
    });

    it('sets the headline in the display font at hero scale', () => {
      const heading = el().querySelector('h1');

      expect(heading?.classList.contains('font-display')).toBe(true);
    });
  });

  // The wireframe/particle hero scene, deferred behind
  // `on viewport` and out of the prerendered/initial bundle — same reasoning
  // as the calculator's `@defer` (see calculator-shell-prerender memory).
  describe('deferred hero scene', () => {
    it('ships a static poster — no canvas/3D dependency — before the defer block completes', () => {
      expect(el().querySelector('.hero-scene-poster')).not.toBeNull();
      expect(el().querySelector('app-scroll-scene')).toBeNull();
    });

    it('renders the scroll scene once the defer block completes', async () => {
      const deferBlocks = await fixture.getDeferBlocks();
      await deferBlocks[0].render(DeferBlockState.Complete);

      expect(fixture.nativeElement.querySelector('app-scroll-scene')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('.hero-scene-poster')).toBeNull();
    });
  });
});
