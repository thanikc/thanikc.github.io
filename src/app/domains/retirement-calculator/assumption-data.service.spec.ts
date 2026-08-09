import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AssumptionDataService } from './assumption-data.service';

describe('AssumptionDataService', () => {
  let service: AssumptionDataService;
  let httpMock: HttpTestingController;

  const mockInflationResponse = [
    {},
    [
      {
        country: { id: 'US', value: 'United States' },
        date: '2026',
        value: 3.4, // 3.4% inflation
      },
    ],
  ];

  const mockMarketResponse = [
    {},
    [{ country: { id: 'US', value: 'United States' }, date: '2026', value: 10 }],
  ];

  /** 15 entries: 10 valid values (10,20,…,100), 5 nulls → average = 55 */
  const mockMarketMultiResponse = [
    {},
    [
      { country: { id: 'US', value: 'United States' }, date: '2020', value: 10 },
      { country: { id: 'US', value: 'United States' }, date: '2021', value: 20 },
      { country: { id: 'US', value: 'United States' }, date: '2022', value: 30 },
      { country: { id: 'US', value: 'United States' }, date: '2023', value: 40 },
      { country: { id: 'US', value: 'United States' }, date: '2024', value: 50 },
      { country: { id: 'US', value: 'United States' }, date: '2025', value: 60 },
      { country: { id: 'US', value: 'United States' }, date: '2026', value: 70 },
      { country: { id: 'US', value: 'United States' }, date: '2027', value: 80 },
      { country: { id: 'US', value: 'United States' }, date: '2028', value: 90 },
      { country: { id: 'US', value: 'United States' }, date: '2029', value: 100 },
      { country: { id: 'US', value: 'United States' }, date: '2030', value: null },
      { country: { id: 'US', value: 'United States' }, date: '2031', value: null },
      { country: { id: 'US', value: 'United States' }, date: '2032', value: null },
      { country: { id: 'US', value: 'United States' }, date: '2033', value: null },
      { country: { id: 'US', value: 'United States' }, date: '2034', value: null },
    ],
  ];

  /** 15 entries, all null → should fall back to default 7 */
  const mockMarketAllNullResponse = [
    {},
    Array.from({ length: 15 }, (_, i) => ({
      country: { id: 'US', value: 'United States' },
      date: String(2020 + i),
      value: null as unknown as number,
    })),
  ];

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

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return default fallbacks before HTTP requests resolve', () => {
    expect(service.isLive()).toBeFalsy();
    expect(service.inflationRate()).toBe(0.025);
    expect(service.estimatedAnnualReturn()).toBe(7);
    expect(service.safeWithdrawalRate()).toBe(4.0);
  });

  it('should fetch macroeconomic data and update computed signals on success', async () => {
    TestBed.tick();
    const reqs = httpMock.match(req => true);
    expect(reqs.length).toBe(2);

    const inflationReq = reqs.find(req => req.request.url.includes('FP.CPI.TOTL.ZG'));
    const marketReq = reqs.find(req => req.request.url.includes('CM.MKT.INDX.ZG'));

    expect(inflationReq).toBeTruthy();
    expect(marketReq).toBeTruthy();

    inflationReq!.flush(mockInflationResponse);
    marketReq!.flush(mockMarketResponse);

    await TestBed.inject(ApplicationRef).whenStable();

    expect(service.isLive()).toBeTruthy();
    expect(service.inflationRate()).toBe(0.034);
    expect(service.estimatedAnnualReturn()).toBe(10); // single valid value → average = 10
    expect(service.realAnnualReturn()).toBe(10 - 0.034);
  });

  it('should gracefully handle API errors by using fallbacks', () => {
    TestBed.tick();
    const reqs = httpMock.match(req => true);

    reqs.forEach(req =>
      req.flush('Error fetching data', {
        status: 500,
        statusText: 'Internal Server Error',
      }),
    );

    expect(service.isLive()).toBeFalsy();
    expect(service.inflationRate()).toBe(0.025);
    expect(service.estimatedAnnualReturn()).toBe(7);
  });

  it('should average valid market return values, ignoring null entries', async () => {
    TestBed.tick();
    const reqs = httpMock.match(req => true);

    // Flush inflation with a basic mock so both resources resolve
    const inflationReq = reqs.find(req => req.request.url.includes('FP.CPI.TOTL.ZG'));
    const marketReq = reqs.find(req => req.request.url.includes('CM.MKT.INDX.ZG'));
    expect(inflationReq).toBeTruthy();
    expect(marketReq).toBeTruthy();

    inflationReq!.flush(mockInflationResponse);
    marketReq!.flush(mockMarketMultiResponse);
    await TestBed.inject(ApplicationRef).whenStable();

    // (10+20+30+40+50+60+70+80+90+100) / 10 = 550 / 10 = 55
    expect(service.estimatedAnnualReturn()).toBe(55);
  });

  it('should fall back to default when all market return entries are null', async () => {
    TestBed.tick();
    const reqs = httpMock.match(req => true);

    const inflationReq = reqs.find(req => req.request.url.includes('FP.CPI.TOTL.ZG'));
    const marketReq = reqs.find(req => req.request.url.includes('CM.MKT.INDX.ZG'));
    expect(inflationReq).toBeTruthy();
    expect(marketReq).toBeTruthy();

    inflationReq!.flush(mockInflationResponse);
    marketReq!.flush(mockMarketAllNullResponse);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(service.estimatedAnnualReturn()).toBe(7);
  });
});
