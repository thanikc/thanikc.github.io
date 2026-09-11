import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ProfileHeroComponent } from './profile-hero.component';
import { ChatService } from '../chat/chat.service';
import { paletteClassesIn } from '../../shared/testing/palette-classes';

describe('ProfileHeroComponent', () => {
  let fixture: ComponentFixture<ProfileHeroComponent>;

  const el = () => fixture.nativeElement as HTMLElement;
  const text = () => el().textContent?.replace(/\s+/g, ' ') ?? '';
  const linkTo = (href: string) =>
    [...el().querySelectorAll<HTMLAnchorElement>('a')].find(a => a.getAttribute('href') === href);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileHeroComponent],
      providers: [{ provide: ChatService, useValue: { open: vi.fn() } }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileHeroComponent);
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
    expect(positioning).toContain('reshaping');
  });

  // Owner's decisions: industry only, no company names, no credential line.
  it('names no companies and carries no years-of-experience line', () => {
    expect(text()).not.toMatch(/attempto|Atruvia|Fiducia|Genossenschaft/i);
    expect(text()).not.toMatch(/\d+\+? years/i);
  });

  it('drops the repeated technology subtitle', () => {
    expect(text()).not.toContain('OpenShift Solutions');
  });

  // The Ask AI Ling pitch now lives in its own section right below the hero
  // (app-profile-ask-ling); repeating it here read as saying the same thing twice.
  it('carries no separate AI Ling invitation or button of its own', () => {
    expect(el().querySelector('.hero-invitation')).toBeNull();
    expect(el().querySelector('app-ask-ling-link')).toBeNull();
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

  it('pins the actions to the bottom of the hero card', () => {
    const next = el().querySelector('.hero-next');

    expect(el().querySelector('.hero-card')?.classList.contains('flex-col')).toBe(true);
    expect(next?.classList.contains('mt-auto')).toBe(true);
    expect(next?.querySelector('a')).not.toBeNull();
  });

  it('colours itself from theme tokens, not the Tailwind palette', () => {
    expect(paletteClassesIn(el())).toEqual([]);
  });
});
