import { TestBed } from '@angular/core/testing';
import { EnvironmentInjector } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { provideLocaleHead } from './locale-head.provider';
import { LocaleHeadService } from './locale-head.service';

describe('provideLocaleHead()', () => {
  it('refreshes the canonical and hreflang links after every navigation', () => {
    const update = vi.spyOn(LocaleHeadService.prototype, 'update').mockImplementation(() => {});
    const events = new Subject<NavigationEnd>();

    TestBed.configureTestingModule({
      providers: [provideLocaleHead(), { provide: Router, useValue: { events } }],
    });
    TestBed.inject(EnvironmentInjector);

    events.next(new NavigationEnd(1, '/', '/privacy-policy'));
    TestBed.tick();

    expect(update).toHaveBeenCalledWith('/privacy-policy');

    update.mockRestore();
  });
});
