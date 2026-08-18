import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { expect, it, describe, beforeEach } from 'vitest';
import { ProfileComponent } from './profile.component';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  const projectLinks = () => [
    ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('.project-card'),
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeDefined();
  });

  it('should render the intro paragraph in the hero section', () => {
    const intro = (fixture.nativeElement as HTMLElement).querySelector('.hero-intro');

    expect(intro).not.toBeNull();
    expect(intro!.textContent?.trim()).toBe(component.intro);
    expect(component.intro.length).toBeGreaterThan(0);
  });

  it('should render one card per configured side project', () => {
    expect(projectLinks().length).toBe(component.sideProjects.length);
    expect(projectLinks().map(link => link.getAttribute('href'))).toEqual(
      component.sideProjects.map(project => project.url),
    );
  });

  it('should link to CrashDash with its description', () => {
    const crashDash = projectLinks().find(
      link => link.getAttribute('href') === 'https://crashdash.singdee.de/',
    );

    expect(crashDash).toBeDefined();
    expect(crashDash!.textContent).toContain('CrashDash');
    expect(crashDash!.textContent).toContain('market crash');
  });

  it('should open external project links safely in a new tab', () => {
    const externalLinks = projectLinks().filter(link =>
      link.getAttribute('href')?.startsWith('http'),
    );

    expect(externalLinks.length).toBeGreaterThan(0);
    for (const link of externalLinks) {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    }
  });

  it('should link to the Retirement Calculator as an in-app route', () => {
    const calculatorLink = projectLinks().find(link => link.getAttribute('href') === '/calculator');

    expect(calculatorLink).toBeDefined();
    expect(calculatorLink!.textContent).toContain('Retirement Calculator');
    expect(calculatorLink!.getAttribute('target')).toBeNull();
  });
});
