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

    expect(el().querySelector(`#${labelId}`)?.textContent?.trim()).toBe(
      'Complete products I build independently, from data model to deployment',
    );
  });

  // Editorial two-tone headline: the claim reads at
  // full strength, the scope detail recedes to the page's muted tone — same copy, no new
  // i18n string, just which words carry the emphasis.
  it('emphasises the claim clause of the headline over the scope detail', () => {
    const heading = el().querySelector('#projects-heading')!;

    expect(heading.querySelector('strong')?.textContent?.trim()).toBe(
      'Complete products I build independently,',
    );
  });

  // Redesign: one horizontal row — featured
  // projects still lead, but as ordering within the row, not a separate one.
  it('lists featured projects before the rest, in one row', () => {
    expect(namesIn('.projects-row')).toEqual(['A', 'C', 'B', 'D']);
  });

  it('shows an empty state when there are no projects', () => {
    render([]);

    expect(el().querySelectorAll('app-project-card')).toHaveLength(0);
    expect(el().textContent).toContain('Nothing to show yet.');
  });
});
