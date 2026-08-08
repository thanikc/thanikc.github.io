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
    [
      {
        country: { id: 'US', value: 'United States' },
        date: '2026',
        value: 10, // 10% market return
      },
    ],
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
    expect(service.inflationRate()).toBe(0.025); // 2.5% baseline
    expect(service.estimatedAnnualReturn()).toBe(7); // Math.round(0.07 * 100) = 7
    expect(service.safeWithdrawalRate()).toBe(4.0);
  });

  it('should fetch macroeconomic data and update computed signals on success', async () => {
    TestBed.tick(); // run httpResource load effects so requests are issued
    const reqs = httpMock.match(req => true);
    expect(reqs.length).toBe(2);

    const inflationReq = reqs.find(req => req.request.url.includes('FP.CPI.TOTL.ZG'));
    const marketReq = reqs.find(req => req.request.url.includes('NY.GDP.MKTP.KD.ZG'));

    expect(inflationReq).toBeTruthy();
    expect(marketReq).toBeTruthy();

    // Flush mock responses
    inflationReq!.flush(mockInflationResponse);
    marketReq!.flush(mockMarketResponse);

    // httpResource commits the flushed response to its state signal asynchronously
    // (its loader resolves a promise awaited in the resource's load effect), so wait
    // for the app to stabilize before asserting on the computed signals.
    await TestBed.inject(ApplicationRef).whenStable();

    // Verify dynamic reactive computed values
    expect(service.isLive()).toBeTruthy();
    expect(service.inflationRate()).toBe(0.034); // 3.4 / 100
    expect(service.estimatedAnnualReturn()).toBe(10); // Math.round(0.1 * 100)
    expect(service.realAnnualReturn()).toBe(10 - 0.034); // 9.966
  });

  it('should gracefully handle API errors by using fallbacks', () => {
    TestBed.tick(); // run httpResource load effects so requests are issued
    const reqs = httpMock.match(req => true);

    // Simulate 500 error on both endpoints
    reqs.forEach(req =>
      req.flush('Error fetching data', {
        status: 500,
        statusText: 'Internal Server Error',
      }),
    );

    // Assert service falls back to default assumptions
    expect(service.isLive()).toBeFalsy();
    expect(service.inflationRate()).toBe(0.025);
    expect(service.estimatedAnnualReturn()).toBe(7);
  });
});
