import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { CtaTrackingDirective } from './cta-tracking.directive';
import { AnalyticsService } from './analytics.service';

@Component({
  template: `
    <a data-cta-tracking="Test CTA" href="https://example.com/page">
      <span>Nested label</span>
    </a>
    <a href="https://example.com/untracked">Untracked</a>
  `,
  hostDirectives: [CtaTrackingDirective],
})
class HostComponent {}

describe('CtaTrackingDirective', () => {
  let trackEventSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    trackEventSpy = vi.spyOn(AnalyticsService.prototype, 'trackEvent').mockImplementation(() => {});
  });

  afterEach(() => {
    trackEventSpy.mockRestore();
  });

  // jsdom has no real navigation; without preventDefault it logs a "Not
  // implemented" error to stderr for every one of these real <a href> clicks.
  const click = (el: Element) => {
    el.addEventListener('click', e => e.preventDefault());
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  };

  it('reports a cta event when a tracked link is clicked', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('[data-cta-tracking]');

    click(link);

    expect(trackEventSpy).toHaveBeenCalledWith('cta', {
      label: 'Test CTA',
      url: 'https://example.com/page',
    });
  });

  it('reports the event when a nested element inside the tracked link is clicked', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const nested: HTMLElement = fixture.nativeElement.querySelector('span');

    click(nested);

    expect(trackEventSpy).toHaveBeenCalledWith('cta', {
      label: 'Test CTA',
      url: 'https://example.com/page',
    });
  });

  it('does nothing when the clicked element has no data-cta-tracking ancestor', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const untracked: HTMLAnchorElement = fixture.nativeElement.querySelector(
      'a:not([data-cta-tracking])',
    );

    click(untracked);

    expect(trackEventSpy).not.toHaveBeenCalled();
  });
});
