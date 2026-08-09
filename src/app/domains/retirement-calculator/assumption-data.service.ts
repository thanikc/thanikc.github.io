import { Injectable, computed, signal } from '@angular/core';
import { httpResource, HttpResourceRef } from '@angular/common/http';

export type WorldBankResponse = [
  {
    page: number;
    pages: number;
    per_page: number;
    total: number;
    sourceid: string;
    lastupdated: string;
  },
  Array<{
    indicator: {
      id: string;
      value: string;
    };
    country: {
      id: string;
      value: string;
    };
    countryiso3code: string;
    date: string;
    value: number | null;
    unit: string;
    obs_status: string;
    decimal: number;
  }>,
];

// https://datahelpdesk.worldbank.org/knowledgebase/articles/898581-api-basic-call-structures
const getMarketDataEndpoint = (country: string, indicator: string, perPage = 1) => {
  return `https://api.worldbank.org/v2/country/${country}/indicator/${indicator}?format=json&per_page=${perPage}`;
};

const getWorldBankResponseValue = (
  res: HttpResourceRef<WorldBankResponse | undefined>,
  defaultValue: number,
): number => {
  const rawVal = res.value()?.[1]?.[0]?.value;
  return typeof rawVal === 'number' ? rawVal : defaultValue;
};

/** Compute the average of all valid (non-null) values from a multi-entry response.
 *  Falls back to defaultValue when no entry has a valid numeric value. */
const getWorldBankResponseAverage = (
  res: HttpResourceRef<WorldBankResponse | undefined>,
  defaultValue: number,
): number => {
  const entries = res.value()?.[1];
  if (!entries || entries.length === 0) return defaultValue;

  const valid = entries.map(e => e.value).filter((v): v is number => typeof v === 'number');

  return valid.length > 0 ? valid.reduce((sum, v) => sum + v, 0) / valid.length : defaultValue;
};

@Injectable({
  providedIn: 'root',
})
export class AssumptionDataService {
  // Default fallbacks in case APIs fail or offline
  private readonly DEFAULT_INFLATION = 2.5; // 2.5%
  private readonly DEFAULT_ANNUAL_RETURN = 7; // 7.0%

  readonly inflationResource = httpResource<WorldBankResponse>(() =>
    getMarketDataEndpoint('USA', 'FP.CPI.TOTL.ZG'),
  );

  readonly marketReturnResource = httpResource<WorldBankResponse>(() =>
    getMarketDataEndpoint('USA', 'CM.MKT.INDX.ZG', 15),
  );

  // Computed Signal: Inflation Rate (Live API or Fallback)
  readonly inflationRate = computed(() => {
    return getWorldBankResponseValue(this.inflationResource, this.DEFAULT_INFLATION) / 100;
  });

  // Computed Signal: Dynamic Estimated Annual Return (Live API or Fallback)
  readonly estimatedAnnualReturn = computed(() => {
    const avg = getWorldBankResponseAverage(this.marketReturnResource, this.DEFAULT_ANNUAL_RETURN);
    return +avg.toFixed(2);
  });

  // Derived Real Return Rate (Nominal Return - Inflation)
  readonly realAnnualReturn = computed(() => {
    return this.estimatedAnnualReturn() - this.inflationRate();
  });

  readonly isLive = computed(() => {
    return this.inflationResource.hasValue() || this.marketReturnResource.hasValue();
  });

  readonly safeWithdrawalRate = signal(4.0); // Standard Trinity rule baseline
}
