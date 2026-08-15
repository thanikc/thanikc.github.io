import { Injectable, computed, signal } from '@angular/core';
import { httpResource, HttpResourceRef } from '@angular/common/http';
import {
  DEFAULT_ANNUAL_RETURN,
  DEFAULT_INFLATION,
  DEFAULT_SAFE_WITHDRAWAL_RATE,
} from './calculator.constants';

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

type WorldBankResource = HttpResourceRef<WorldBankResponse | undefined>;

/** Consumer price inflation, annual %. */
const INFLATION_INDICATOR = 'FP.CPI.TOTL.ZG';
/** S&P Global Equity Indices, annual % change. */
const MARKET_RETURN_INDICATOR = 'CM.MKT.INDX.ZG';
const COUNTRY = 'USA';
/** Years of market data averaged out to smooth single-year swings. */
const MARKET_RETURN_YEARS = 15;

// https://datahelpdesk.worldbank.org/knowledgebase/articles/898581-api-basic-call-structures
const marketDataEndpoint = (country: string, indicator: string, perPage = 1) =>
  `https://api.worldbank.org/v2/country/${country}/indicator/${indicator}?format=json&per_page=${perPage}`;

/** First reported value of a response, or `defaultValue` when none is numeric. */
const firstValueOf = (res: WorldBankResource, defaultValue: number): number => {
  const value = res.value()?.[1]?.[0]?.value;

  return typeof value === 'number' ? value : defaultValue;
};

/** Average of all reported (non-null) values, or `defaultValue` when none is numeric. */
const averageValueOf = (res: WorldBankResource, defaultValue: number): number => {
  const reported = (res.value()?.[1] ?? [])
    .map(entry => entry.value)
    .filter((value): value is number => typeof value === 'number');

  if (reported.length === 0) return defaultValue;

  return reported.reduce((sum, value) => sum + value, 0) / reported.length;
};

/**
 * Live macroeconomic assumptions sourced from the World Bank open data API.
 * Every rate is expressed as a percentage (e.g. `2.5` means 2.5%).
 */
@Injectable({
  providedIn: 'root',
})
export class AssumptionDataService {
  readonly inflationResource = httpResource<WorldBankResponse>(() =>
    marketDataEndpoint(COUNTRY, INFLATION_INDICATOR),
  );

  readonly marketReturnResource = httpResource<WorldBankResponse>(() =>
    marketDataEndpoint(COUNTRY, MARKET_RETURN_INDICATOR, MARKET_RETURN_YEARS),
  );

  /** Latest reported annual inflation, in percent. */
  readonly inflationRate = computed(() => firstValueOf(this.inflationResource, DEFAULT_INFLATION));

  /** Multi-year average market return, in percent. */
  readonly estimatedAnnualReturn = computed(() =>
    Number(averageValueOf(this.marketReturnResource, DEFAULT_ANNUAL_RETURN).toFixed(2)),
  );

  /** Inflation-adjusted market return, in percent. */
  readonly realAnnualReturn = computed(() => this.estimatedAnnualReturn() - this.inflationRate());

  readonly safeWithdrawalRate = signal(DEFAULT_SAFE_WITHDRAWAL_RATE);

  /** Whether at least one indicator resolved from the live API rather than a fallback. */
  readonly isLive = computed(
    () => this.inflationResource.hasValue() || this.marketReturnResource.hasValue(),
  );

  /** Whether any indicator is still in flight. */
  readonly isLoading = computed(
    () => this.inflationResource.isLoading() || this.marketReturnResource.isLoading(),
  );
}
