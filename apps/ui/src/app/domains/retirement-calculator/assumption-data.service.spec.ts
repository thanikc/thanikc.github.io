import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AssumptionDataService } from './assumption-data.service';
import { DEFAULT_ANNUAL_RETURN } from './calculator.constants';

const series = (values: Record<string, number | null>) => [
  {},
  Object.entries(values).map(([date, value]) => ({
    country: { id: 'US', value: 'United States' },
    date,
    value,
  })),
];

describe('AssumptionDataService', () => {
  let service: AssumptionDataService;
  let httpMock: HttpTestingController;

  const flush = async (
    market: Record<string, number | null>,
    inflation: Record<string, number | null>,
  ) => {
    TestBed.tick();
    httpMock.expectOne(req => req.url.includes('CM.MKT.INDX.ZG')).flush(series(market));
    httpMock.expectOne(req => req.url.includes('FP.CPI.TOTL.ZG')).flush(series(inflation));
    await TestBed.inject(ApplicationRef).whenStable();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), AssumptionDataService],
    });

    service = TestBed.inject(AssumptionDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('starts from the real-return baseline before the data resolves', () => {
    expect(service.isLive()).toBe(false);
    expect(service.estimatedAnnualReturn()).toBe(DEFAULT_ANNUAL_RETURN);
    expect(service.safeWithdrawalRate()).toBe(4);
    expect(service.returnPeriod()).toBeNull();
  });

  // The withdrawal rule and the target income are in today's money, so the
  // return has to be real (after inflation), not the index's nominal change.
  it('derives a real return from US market and inflation data', async () => {
    // (1.10 × 1.21) / (1.00 × 1.10) = 1.21 over two years → 10% a year, real.
    await flush({ '2021': 21, '2020': 10 }, { '2021': 10, '2020': 0 });

    expect(service.isLive()).toBe(true);
    expect(service.estimatedAnnualReturn()).toBe(10);
  });

  // Averaging yearly % changes overstates what money actually grows by; a
  // +50% year then a -50% year leaves you with 75%, not 100%.
  it('compounds the years instead of averaging the percentages', async () => {
    await flush({ '2021': -50, '2020': 50 }, { '2021': 0, '2020': 0 });

    expect(service.estimatedAnnualReturn()).toBe(-13.4);
  });

  it('uses only years both series report, and names that period', async () => {
    await flush(
      { '2025': 40, '2024': 10, '2023': 10, '2022': null },
      { '2025': null, '2024': 0, '2023': 0, '2022': 3 },
    );

    expect(service.estimatedAnnualReturn()).toBe(10);
    expect(service.returnPeriod()).toEqual({ from: 2023, to: 2024 });
  });

  it('asks for 30 years of each series', () => {
    TestBed.tick();
    const reqs = httpMock.match(() => true);

    expect(reqs.map(r => r.request.url).every(url => url.includes('per_page=30'))).toBe(true);
    reqs.forEach(r => r.flush(series({})));
  });

  it('falls back to the baseline when either series fails', async () => {
    TestBed.tick();
    httpMock.expectOne(req => req.url.includes('CM.MKT.INDX.ZG')).flush(series({ '2024': 10 }));
    httpMock
      .expectOne(req => req.url.includes('FP.CPI.TOTL.ZG'))
      .flush('down', { status: 500, statusText: 'Internal Server Error' });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(service.isLive()).toBe(false);
    expect(service.estimatedAnnualReturn()).toBe(DEFAULT_ANNUAL_RETURN);
    expect(service.returnPeriod()).toBeNull();
  });

  it('falls back to the baseline when no year has both values', async () => {
    await flush({ '2024': 10 }, { '2023': 2 });

    expect(service.isLive()).toBe(false);
    expect(service.estimatedAnnualReturn()).toBe(DEFAULT_ANNUAL_RETURN);
  });
});
