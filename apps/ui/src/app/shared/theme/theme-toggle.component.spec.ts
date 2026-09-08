import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { MatMenuTrigger } from '@angular/material/menu';
import { expect, it, describe, beforeEach, vi } from 'vitest';
import { ThemeToggleComponent } from './theme-toggle.component';
import { ThemeMode, ThemeService } from './theme.service';

describe('ThemeToggleComponent', () => {
  let component: ThemeToggleComponent;
  let fixture: ComponentFixture<ThemeToggleComponent>;

  const mockMode = signal<ThemeMode>('system');
  const setMode = vi.fn((mode: ThemeMode) => mockMode.set(mode));
  const mockThemeService = {
    mode: mockMode,
    setMode,
  };

  const menuPanel = () => document.querySelector<HTMLElement>('.mat-mdc-menu-panel');

  const openMenu = (): MatMenuTrigger => {
    const button = fixture.nativeElement.querySelector(
      'button[mat-icon-button]',
    ) as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    return fixture.debugElement.query(By.directive(MatMenuTrigger))
      .componentInstance as MatMenuTrigger;
  };

  beforeEach(async () => {
    mockMode.set('system');
    setMode.mockClear();

    await TestBed.configureTestingModule({
      imports: [ThemeToggleComponent],
      providers: [{ provide: ThemeService, useValue: mockThemeService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeDefined();
  });

  it('should render an accessible trigger button showing the system icon by default', () => {
    const button = fixture.nativeElement.querySelector(
      'button[mat-icon-button]',
    ) as HTMLButtonElement;

    expect(button).not.toBeNull();
    expect(button.getAttribute('aria-label')).toBeTruthy();
    expect(button.querySelector('mat-icon')?.textContent?.trim()).toBe('brightness_auto');
  });

  it('should open a menu with System, Light, and Dark options', () => {
    openMenu();

    const items = menuPanel()!.querySelectorAll('.mat-mdc-menu-item');

    expect(items.length).toBe(3);
    expect(menuPanel()!.textContent).toContain('System');
    expect(menuPanel()!.textContent).toContain('Light');
    expect(menuPanel()!.textContent).toContain('Dark');
  });

  it('should call ThemeService.setMode with "dark" when the Dark option is clicked', () => {
    openMenu();

    const items = [...menuPanel()!.querySelectorAll<HTMLElement>('.mat-mdc-menu-item')];
    const darkItem = items.find(item => item.textContent?.includes('Dark'))!;
    darkItem.click();
    fixture.detectChanges();

    expect(setMode).toHaveBeenCalledWith('dark');
  });

  it('should update the trigger icon once the mode changes to dark', () => {
    mockMode.set('dark');
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      'button[mat-icon-button]',
    ) as HTMLButtonElement;

    expect(button.querySelector('mat-icon')?.textContent?.trim()).toBe('dark_mode');
  });
});
