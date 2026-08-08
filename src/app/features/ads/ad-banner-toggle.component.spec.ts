import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { expect, it, describe, beforeEach } from 'vitest';
import { AdBannerToggleComponent } from './ad-banner-toggle.component';
import { AdBannerService } from './ad-banner.service';

describe('AdBannerToggleComponent', () => {
  let component: AdBannerToggleComponent;
  let fixture: ComponentFixture<AdBannerToggleComponent>;

  // Create a mock service with a real writeable signal
  const mockShowBanner = signal(true);
  const mockAdBannerService = {
    showBanner: mockShowBanner,
  };

  beforeEach(async () => {
    // Reset the signal state before every test
    mockShowBanner.set(true);

    await TestBed.configureTestingModule({
      imports: [AdBannerToggleComponent], // Component imports MatSlideToggle internally
      providers: [{ provide: AdBannerService, useValue: mockAdBannerService }],
    }).compileComponents();

    fixture = TestBed.createComponent(AdBannerToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Triggers initial lifecycle hooks and template rendering
  });

  it('should create the component', () => {
    expect(component).toBeDefined();
  });

  it('should call the service and change the signal when the toggle changes', () => {
    // Find the Material Slide Toggle component in the DOM
    const toggleDebugEl = fixture.debugElement.query(By.directive(MatSlideToggle));
    const toggleInstance = toggleDebugEl.componentInstance as MatSlideToggle;

    // Simulate the user changing the state to unchecked (false)
    toggleInstance.checked = false;

    // Emit the change event exactly like Material does
    toggleInstance.change.emit({ checked: false, source: toggleInstance });

    // Assert that the service's signal updated correctly
    expect(mockAdBannerService.showBanner()).toBe(false);
  });
});
