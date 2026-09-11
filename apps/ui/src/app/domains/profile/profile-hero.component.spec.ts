import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { ProfileHeroComponent } from './profile-hero.component';
import { AskLingLinkComponent } from '../chat/ask-ling-link.component';
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
    expect(el().querySelector('.hero-badge')?.textContent?.trim()).toBe('Full-stack engineer');
    expect(el().querySelectorAll('h1')).toHaveLength(1);
    expect(el().querySelector('h1')?.textContent?.trim()).toBe('Thanik Cheowtirakul');
  });

  // Positioning, not a technology string: what he builds, for whom, and how AI fits.
  it('states the positioning in one sentence', () => {
    const positioning = el().querySelector('.hero-positioning')?.textContent ?? '';

    expect(positioning).toContain('Angular and Spring Boot');
    expect(positioning).toContain('German online banking');
    expect(positioning).toContain('AI');
  });

  // Owner's decisions: industry only, no company names, no credential line.
  it('names no companies and carries no years-of-experience line', () => {
    expect(text()).not.toMatch(/attempto|Atruvia|Fiducia|Genossenschaft/i);
    expect(text()).not.toMatch(/\d+\+? years/i);
  });

  it('drops the repeated technology subtitle', () => {
    expect(text()).not.toContain('OpenShift Solutions');
  });

  it('invites the visitor to AI Ling for the long version', () => {
    expect(el().querySelector('.hero-invitation')?.textContent?.trim()).toBe(
      'This page is the short version. AI Ling has the long one.',
    );
  });

  // One primary action: AI Ling, filled; the chat's starters take over from there.
  it('offers Ask AI Ling as the filled primary action, without a preset question', () => {
    const askLing = fixture.debugElement.query(By.directive(AskLingLinkComponent));
    const instance = askLing.componentInstance as AskLingLinkComponent;

    expect(instance.appearance()).toBe('filled');
    expect(instance.question()).toBeUndefined();
  });

  it('offers Email and LinkedIn as secondary, tracked actions', () => {
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
    }
  });

  it('pins the invitation and actions to the bottom of the hero card', () => {
    const next = el().querySelector('.hero-next');

    expect(el().querySelector('.hero-card')?.classList.contains('flex-col')).toBe(true);
    expect(next?.classList.contains('mt-auto')).toBe(true);
    expect(next?.querySelector('.hero-invitation')).not.toBeNull();
    expect(next?.querySelector('app-ask-ling-link')).not.toBeNull();
  });

  it('colours itself from theme tokens, not the Tailwind palette', () => {
    expect(paletteClassesIn(el())).toEqual([]);
  });
});
