import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatMenuTrigger } from '@angular/material/menu';
import { expect, it, describe, beforeEach } from 'vitest';
import { BurgerMenuComponent } from './burger-menu.component';
import { AdBannerService } from '../../domains/ads/ad-banner.service';

@Component({ template: '' })
class RoutedStubComponent {}

describe('BurgerMenuComponent', () => {
  let component: BurgerMenuComponent;
  let fixture: ComponentFixture<BurgerMenuComponent>;

  // Create a mock service with a real writeable signal
  const mockShowBanner = signal(true);
  const mockAdBannerService = {
    showBanner: mockShowBanner,
  };

  // MatMenu renders its content into a CDK overlay attached to document.body
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
    // Reset the signal state before every test
    mockShowBanner.set(true);

    await TestBed.configureTestingModule({
      imports: [BurgerMenuComponent],
      providers: [
        provideRouter([
          { path: 'profile', component: RoutedStubComponent },
          { path: 'calculator', component: RoutedStubComponent },
        ]),
        provideNoopAnimations(),
        { provide: AdBannerService, useValue: mockAdBannerService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BurgerMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeDefined();
  });

  it('should render an accessible burger menu trigger button', () => {
    const button = fixture.nativeElement.querySelector(
      'button[mat-icon-button]',
    ) as HTMLButtonElement;

    expect(button).not.toBeNull();
    expect(button.getAttribute('aria-label')).toBeTruthy();
    expect(button.querySelector('mat-icon')?.textContent?.trim()).toBe('menu');
  });

  it('should keep the menu closed by default', () => {
    const trigger = fixture.debugElement.query(By.directive(MatMenuTrigger))
      .componentInstance as MatMenuTrigger;

    expect(trigger.menuOpen).toBe(false);
    expect(menuPanel()).toBeNull();
  });

  it('should open the MatMenu dropdown when the trigger is clicked', () => {
    const trigger = openMenu();

    expect(trigger.menuOpen).toBe(true);
    expect(menuPanel()).not.toBeNull();
  });

  it('should render exactly three menu items mirroring the desktop nav', () => {
    openMenu();

    const items = menuPanel()!.querySelectorAll('.mat-mdc-menu-item');

    expect(items.length).toBe(3);
  });

  it('should contain a Profile link with the person icon', () => {
    openMenu();

    const link = menuPanel()!.querySelector<HTMLAnchorElement>('a[routerlink="/profile"]');

    expect(link).not.toBeNull();
    expect(link!.classList.contains('mat-mdc-menu-item')).toBe(true);
    expect(link!.querySelector('mat-icon')?.textContent?.trim()).toBe('person');
    expect(link!.textContent).toContain('Profile');
  });

  it('should contain a Calculator link with the calculate icon', () => {
    openMenu();

    const link = menuPanel()!.querySelector<HTMLAnchorElement>('a[routerlink="/calculator"]');

    expect(link).not.toBeNull();
    expect(link!.classList.contains('mat-mdc-menu-item')).toBe(true);
    expect(link!.querySelector('mat-icon')?.textContent?.trim()).toBe('calculate');
    expect(link!.textContent).toContain('Calculator');
  });

  it('should close the menu when a navigation link is clicked', async () => {
    const trigger = openMenu();

    const link = menuPanel()!.querySelector<HTMLAnchorElement>('a[routerlink="/profile"]')!;
    link.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(trigger.menuOpen).toBe(false);
  });

  it('should render the ad banner toggle inside the menu', () => {
    openMenu();

    const toggle = menuPanel()!.querySelector('mat-slide-toggle');

    expect(toggle).not.toBeNull();
  });

  it('should write to AdBannerService.showBanner when the toggle changes', () => {
    openMenu();

    const toggleSwitch = menuPanel()!.querySelector<HTMLButtonElement>('mat-slide-toggle button')!;
    toggleSwitch.click();
    fixture.detectChanges();

    expect(mockAdBannerService.showBanner()).toBe(false);
  });

  it('should keep the menu open while interacting with the ad toggle', () => {
    const trigger = openMenu();

    const toggleItem = menuPanel()!.querySelector<HTMLElement>('.ad-toggle-item')!;
    toggleItem.click();
    fixture.detectChanges();

    expect(trigger.menuOpen).toBe(true);
  });
});
