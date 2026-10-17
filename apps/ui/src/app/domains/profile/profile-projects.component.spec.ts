import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { ProfileProjectsComponent } from './profile-projects.component';
import { Project } from './profile.content';
import { ChatService } from '../chat/chat.service';

const project = (name: string, featured: boolean): Project => ({
  name,
  tagline: `${name} tagline`,
  decision: `${name} decision`,
  stack: ['Angular'],
  status: { label: 'Live' },
  featured,
  hookLabel: 'Ask',
  question: `What is ${name}?`,
});

describe('ProfileProjectsComponent', () => {
  let fixture: ComponentFixture<ProfileProjectsComponent>;

  const el = () => fixture.nativeElement as HTMLElement;
  const namesIn = (selector: string) =>
    [...el().querySelectorAll(`${selector} h3`)].map(h => h.textContent?.trim());

  const render = (projects: Project[]) => {
    fixture.componentRef.setInput('projects', projects);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileProjectsComponent],
      providers: [provideRouter([]), { provide: ChatService, useValue: { open: vi.fn() } }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileProjectsComponent);
    render([project('A', true), project('B', false), project('C', true), project('D', false)]);
  });

  it('is a section labelled by its headline', () => {
    const section = el().querySelector('section');
    const labelId = section?.getAttribute('aria-labelledby');

    expect(el().querySelector(`#${labelId} .section-title`)?.textContent?.trim()).toBe(
      'Complete products I build independently, from data model to deployment',
    );
  });

  // One section-header component for every section, so a change to how sections
  // open (as their heading semantics just did) can't miss this one.
  it('opens with the shared section header', () => {
    expect(el().querySelector('app-section-header #projects-heading')).not.toBeNull();
  });

  // One headline style for every section: no section opens two-tone.
  it('opens on a single-tone headline like every other section', () => {
    const heading = el().querySelector('#projects-heading')!;

    expect(heading.querySelector('strong')).toBeNull();
    expect(heading.querySelector('.section-title.page-muted')).toBeNull();
    expect(heading.textContent).toContain(
      'Complete products I build independently, from data model to deployment',
    );
  });

  // Featured projects lead, as ordering within the one grid, not a separate group.
  it('lists featured projects before the rest', () => {
    expect(namesIn('.projects-grid')).toEqual(['A', 'C', 'B', 'D']);
  });

  // Cards side by side share one height (grid's default stretch; each card fills
  // its cell and pins its actions to the bottom), so a short card doesn't sit
  // ragged next to a taller one.
  it('keeps the cards in a row the same height', () => {
    const grid = el().querySelector('.projects-grid')!;

    expect(grid.classList.contains('items-start')).toBe(false);
    expect(grid.querySelector('article')?.classList.contains('h-full')).toBe(true);
  });

  it('shows an empty state when there are no projects', () => {
    render([]);

    expect(el().querySelectorAll('app-project-card')).toHaveLength(0);
    expect(el().textContent).toContain('Nothing to show yet.');
  });
});
