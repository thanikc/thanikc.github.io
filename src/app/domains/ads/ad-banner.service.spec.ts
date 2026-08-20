import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { AdBannerService } from './ad-banner.service';

@Component({ template: '' })
class StubComponent {}

describe('AdBannerService', () => {
  const setup = async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: StubComponent },
          { path: 'calculator', component: StubComponent, data: { ads: false } },
        ]),
      ],
    });

    const service = TestBed.inject(AdBannerService);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/');

    return { service, router };
  };

  it('allows ads on routes without an `ads: false` route data flag', async () => {
    const { service } = await setup();

    expect(service.routeAllowsAds()).toBe(true);
  });

  it('disallows ads on routes flagged `data: { ads: false }`, e.g. the content-thin calculator tool', async () => {
    const { service, router } = await setup();

    await router.navigateByUrl('/calculator');

    expect(service.routeAllowsAds()).toBe(false);
  });

  it('re-allows ads after navigating away from a flagged route', async () => {
    const { service, router } = await setup();

    await router.navigateByUrl('/calculator');
    await router.navigateByUrl('/');

    expect(service.routeAllowsAds()).toBe(true);
  });

  it('defaults showBanner to false while ads are globally disabled', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const service = TestBed.inject(AdBannerService);

    expect(service.showBanner()).toBe(false);
  });

  it('exposes the ads master switch as adsEnabled', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const service = TestBed.inject(AdBannerService);

    expect(service.adsEnabled).toBe(false);
  });
});
