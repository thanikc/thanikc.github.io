import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('defaults to system mode when nothing is stored', () => {
    const service = TestBed.inject(ThemeService);

    expect(service.mode()).toBe('system');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('switches to dark mode, applies the attribute, and persists the choice', () => {
    const service = TestBed.inject(ThemeService);

    service.setMode('dark');

    expect(service.mode()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('theme-mode')).toBe('dark');
  });

  it('switches to light mode and applies the attribute', () => {
    const service = TestBed.inject(ThemeService);

    service.setMode('light');

    expect(service.mode()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('theme-mode')).toBe('light');
  });

  it('switching back to system removes the attribute', () => {
    const service = TestBed.inject(ThemeService);

    service.setMode('dark');
    service.setMode('system');

    expect(service.mode()).toBe('system');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(localStorage.getItem('theme-mode')).toBe('system');
  });

  it('restores a previously stored mode on construction', () => {
    localStorage.setItem('theme-mode', 'dark');

    const service = TestBed.inject(ThemeService);

    expect(service.mode()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('ignores an invalid stored value and falls back to system', () => {
    localStorage.setItem('theme-mode', 'not-a-real-mode');

    const service = TestBed.inject(ThemeService);

    expect(service.mode()).toBe('system');
  });
});
