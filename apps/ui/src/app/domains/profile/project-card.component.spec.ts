import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { ProjectCardComponent } from './project-card.component';
import { Project } from './profile.content';
import { AskLingLinkComponent } from '../chat/ask-ling-link.component';
import { ChatService } from '../chat/chat.service';
import { paletteClassesIn } from '../../shared/testing/palette-classes';

const EXTERNAL: Project = {
  name: 'CrashDash',
  tagline: 'Gauges the risk of a market crash.',
  why: 'Built for my own investing.',
  decision: 'Missing data stays unscored instead of counting as zero.',
  stack: ['Spring Boot', 'Angular'],
  status: { label: 'Private — sign-in required' },
  featured: true,
  primary: { label: 'Open CrashDash', url: 'https://crashdash.example/', external: true },
  source: { label: 'Source', url: 'https://github.com/example/crashdash', external: true },
  hookLabel: 'Ask how the risk score works',
  question: 'How does CrashDash compute its crash-risk level?',
};

const INTERNAL: Project = {
  name: 'Retirement Calculator',
  tagline: 'Projects the nest egg you need.',
  decision: 'Live World Bank data with a fixed fallback.',
  stack: ['Signals'],
  status: { label: 'Live' },
  featured: false,
  primary: { label: 'Open calculator', url: '/calculator', external: false },
  hookLabel: 'Ask where the numbers come from',
  question: 'Where does the retirement calculator get its assumptions?',
};

describe('ProjectCardComponent', () => {
  let fixture: ComponentFixture<ProjectCardComponent>;

  const el = () => fixture.nativeElement as HTMLElement;
  const card = () => el().querySelector<HTMLElement>('article')!;
  const link = (label: string) =>
    [...el().querySelectorAll<HTMLAnchorElement>('a')].find(a => a.textContent?.includes(label));

  const render = (project: Project, index = 0) => {
    fixture.componentRef.setInput('project', project);
    fixture.componentRef.setInput('index', index);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectCardComponent],
      providers: [provideRouter([]), { provide: ChatService, useValue: { open: vi.fn() } }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectCardComponent);
    render(EXTERNAL);
  });

  // The card holds several actions, so it is a static article — not one big link
  // with a button nested inside it.
  it('is a static article, not a link', () => {
    expect(card().closest('a')).toBeNull();
    expect(card().querySelector('h3')?.textContent?.trim()).toBe('CrashDash');
  });

  // Redesign: a filled tile, not a flat cell — the fill alone (no border, no
  // shadow, no radius) is what separates it from the page and its row neighbours,
  // plain white boxes on a grey page.
  it('is a filled tile, not flat on the page', () => {
    expect(card().classList.contains('surface-card')).toBe(true);
    expect([...card().classList]).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/^(rounded|shadow)-/)]),
    );
  });

  // The evidence is the point of the card, so what it is for and the engineering
  // decision are always on the face; only the supporting detail sits behind the
  // disclosure, which is a labelled button of its own rather than the whole face.
  it('shows the tagline and decision up front and the rest behind a disclosure', () => {
    const toggle = card().querySelector<HTMLButtonElement>('button[aria-controls]')!;
    const details = card().querySelector(`#${toggle.getAttribute('aria-controls')}`)!;

    expect(details.contains(card().querySelector('.project-tagline'))).toBe(false);
    expect(details.contains(card().querySelector('.project-decision'))).toBe(false);
    expect(details.contains(card().querySelector('.project-why'))).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.textContent?.trim()).toBe('Details');

    toggle.click();
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.textContent?.trim()).toBe('Hide details');
    expect(card().classList.contains('is-expanded')).toBe(true);
  });

  // A heading inside a button is flattened into the button's name and drops out
  // of heading navigation; the toggle names its project through the heading.
  it('keeps the project name a real heading that also describes the toggle', () => {
    const heading = card().querySelector('h3')!;
    const toggle = card().querySelector<HTMLButtonElement>('button[aria-controls]')!;

    expect(heading.closest('button')).toBeNull();
    expect(toggle.getAttribute('aria-describedby')).toBe(heading.id);
    expect(toggle.hasAttribute('aria-label')).toBe(false);
  });

  it('keeps its actions visible while the details are collapsed', () => {
    const details = card().querySelector('.project-details')!;

    expect(details.contains(link('Open CrashDash')!)).toBe(false);
    expect(details.contains(el().querySelector('app-ask-ling-link'))).toBe(false);
  });

  it('says what it is for, why it exists and one engineering decision', () => {
    expect(card().querySelector('.project-tagline')?.textContent?.trim()).toBe(
      'Gauges the risk of a market crash.',
    );
    expect(card().querySelector('.project-why')?.textContent?.trim()).toBe(
      'Built for my own investing.',
    );
    expect(card().querySelector('.project-decision')?.textContent).toContain(
      'Missing data stays unscored instead of counting as zero.',
    );
  });

  it('omits the why line when there is none', () => {
    render(INTERNAL);

    expect(card().querySelector('.project-why')).toBeNull();
  });

  it('lists the stack as chips', () => {
    const chips = [...card().querySelectorAll('li.surface-chip')].map(c => c.textContent?.trim());

    expect(chips).toEqual(['Spring Boot', 'Angular']);
  });

  it('shows its status as a plain label', () => {
    expect(card().querySelector('.project-status')?.textContent?.trim()).toBe(
      'Private — sign-in required',
    );
  });

  // Redesign: matching the reference tiles' plain typography, no icon glyphs of the
  // card's own — not the status/face marks, not the toggle, not the link affordances.
  // (app-ask-ling-link keeps its own icon; that's a shared component, out of scope.)
  it('carries no material icons of its own', () => {
    const ownIcons = [...card().querySelectorAll('mat-icon')].filter(
      icon => !icon.closest('app-ask-ling-link'),
    );

    expect(ownIcons).toHaveLength(0);
  });

  // Redesign: each tile carries a pixel
  // mosaic in its empty middle. Decorative and generated from the name, so a new
  // project needs no artwork — but it must be stable per project and differ between
  // them, otherwise the row reads as one repeated mark.
  it('carries a decorative pixel mark, its own per project', () => {
    const mark = card().querySelector('.project-mark')!;
    expect(mark.getAttribute('aria-hidden')).toBe('true');

    const cells = (root: Element) =>
      [...root.querySelectorAll('rect')].map(r => `${r.getAttribute('x')},${r.getAttribute('y')}`);
    const crashdash = cells(mark);
    expect(crashdash.length).toBeGreaterThan(5);

    render(INTERNAL);
    expect(cells(card().querySelector('.project-mark')!)).not.toEqual(crashdash);

    render(EXTERNAL);
    expect(cells(card().querySelector('.project-mark')!)).toEqual(crashdash);
  });

  it('opens external links safely in a new tab and says so to screen readers', () => {
    const primary = link('Open CrashDash')!;

    expect(primary.getAttribute('href')).toBe('https://crashdash.example/');
    expect(primary.getAttribute('target')).toBe('_blank');
    expect(primary.getAttribute('rel')).toBe('noopener noreferrer');
    expect(primary.querySelector('.sr-only')?.textContent).toContain('opens in a new tab');
    expect(primary.getAttribute('data-cta-tracking')).toBe('CrashDash: Open CrashDash');
  });

  it('routes internal links in-app, without a new tab', () => {
    render(INTERNAL);
    const primary = link('Open calculator')!;

    expect(primary.getAttribute('href')).toBe('/calculator');
    expect(primary.getAttribute('target')).toBeNull();
  });

  // Every card's first action looks the same: a source-only project's source link
  // is its primary action, so it gets the outlined button too.
  it("gives a source-only project's source link the primary (outlined) style", () => {
    render({ ...EXTERNAL, primary: undefined });

    expect(link('Source')?.classList).toContain('mat-mdc-outlined-button');
  });

  it('links to the source when there is one, and only then', () => {
    expect(link('Source')?.getAttribute('href')).toBe('https://github.com/example/crashdash');

    render(INTERNAL);
    expect(link('Source')).toBeUndefined();
  });

  it('ends with an Ask AI Ling hook about the project', () => {
    const hook = fixture.debugElement.query(By.directive(AskLingLinkComponent))
      .componentInstance as AskLingLinkComponent;

    expect(hook.question()).toBe('How does CrashDash compute its crash-risk level?');
    expect(hook.label()).toBe('Ask how the risk score works');
  });

  // A diagram as an ordered list: real text, theme tokens, readable at 360px.
  it('shows how it works as an ordered flow when the project has one', () => {
    render({
      ...EXTERNAL,
      flow: [
        { label: 'Question', detail: 'from the chat' },
        { label: 'Retrieve', detail: 'top 5 chunks' },
      ],
    });
    const flow = card().querySelector('ol.project-flow');
    const steps = [...(flow?.querySelectorAll(':scope > li') ?? [])];

    expect(flow?.getAttribute('aria-label')).toBe('How CrashDash works');
    expect(steps.map(step => step.querySelector('.flow-label')?.textContent?.trim())).toEqual([
      'Question',
      'Retrieve',
    ]);
    expect(steps[1].textContent).toContain('top 5 chunks');
    // Found in visual review: the step number rendered glued to its label ("1.Question").
    expect(steps[0].querySelector('.flow-step-title')?.classList.contains('gap-1')).toBe(true);
  });

  it('shows no flow when the project has none', () => {
    expect(card().querySelector('.project-flow')).toBeNull();
  });

  it('gives every link a 44px hit area', () => {
    for (const anchor of el().querySelectorAll('a')) {
      expect(anchor.classList.contains('min-h-11')).toBe(true);
    }
  });

  it('colours itself from theme tokens, not the Tailwind palette', () => {
    expect(paletteClassesIn(el())).toEqual([]);
  });
});
