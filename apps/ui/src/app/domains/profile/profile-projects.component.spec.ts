import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { ProfileProjectsComponent } from './profile-projects.component';
import { Project } from './profile.content';
import { ChatService } from '../chat/chat.service';

const project = (name: string, featured: boolean): Project => ({
  name,
  icon: 'star',
  tagline: `${name} tagline`,
  decision: `${name} decision`,
  stack: ['Angular'],
  status: { label: 'Live', icon: 'check_circle' },
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

  it('is a section labelled "Things I’ve built"', () => {
    const section = el().querySelector('section');
    const labelId = section?.getAttribute('aria-labelledby');

    expect(el().querySelector(`#${labelId}`)?.textContent?.trim()).toBe('Things I’ve built');
  });

  // The strongest evidence gets the most room; the small tools follow.
  it('shows featured projects first, in their own row, keeping their order', () => {
    expect(namesIn('.projects-featured')).toEqual(['A', 'C']);
    expect(namesIn('.projects-more')).toEqual(['B', 'D']);

    const featured = el().querySelector('.projects-featured')!;
    const more = el().querySelector('.projects-more')!;
    expect(featured.compareDocumentPosition(more) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('shows an empty state when there are no projects', () => {
    render([]);

    expect(el().querySelectorAll('app-project-card')).toHaveLength(0);
    expect(el().textContent).toContain('Nothing to show yet.');
  });
});
