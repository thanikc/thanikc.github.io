import { Injectable, computed, signal } from '@angular/core';
import { httpResource, HttpResourceRef } from '@angular/common/http';
import { DEFAULT_ANNUAL_RETURN, DEFAULT_SAFE_WITHDRAWAL_RATE } from './calculator.constants';

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

/** S&P Global Equity Indices, annual % change (price index, no dividends). */
const MARKET_RETURN_INDICATOR = 'CM.MKT.INDX.ZG';
/** Consumer price inflation, annual %. */
const INFLATION_INDICATOR = 'FP.CPI.TOTL.ZG';
const COUNTRY = 'USA';
/** Years requested per series: long enough to span full market cycles (2000, 2008, 2022). */
const YEARS = 30;

// https://datahelpdesk.worldbank.org/knowledgebase/articles/898581-api-basic-call-structures
const marketDataEndpoint = (country: string, indicator: string, perPage = 1) =>
  `https://api.worldbank.org/v2/country/${country}/indicator/${indicator}?format=json&per_page=${perPage}`;

/** Reported (non-null) values by year; empty while loading or after an error. */
const valuesByYear = (res: WorldBankResource): Map<number, number> =>
  new Map(
    ((res.hasValue() && res.value()?.[1]) || [])
      .filter(entry => typeof entry.value === 'number')
      .map(entry => [Number(entry.date), entry.value as number]),
  );

/**
 * Compound real return over the years both series report: the growth of the
 * index divided by the growth of prices, taken per year. Compounding, not an
 * average of yearly percentages, which overstates what money actually grows by.
 */
const realReturnOf = (market: Map<number, number>, inflation: Map<number, number>) => {
  const years = [...market.keys()].filter(year => inflation.has(year));
  if (years.length === 0) return null;

  const growth = years.reduce(
    (product, year) => (product * (1 + market.get(year)! / 100)) / (1 + inflation.get(year)! / 100),
    1,
  );

  return {
    rate: (Math.pow(growth, 1 / years.length) - 1) * 100,
    from: Math.min(...years),
    to: Math.max(...years),
  };
};

/**
 * Live macroeconomic assumptions sourced from the World Bank open data API.
 * Every rate is expressed as a percentage (e.g. `2.5` means 2.5%).
 */
@Injectable({
  providedIn: 'root',
})
export class AssumptionDataService {
  readonly marketReturnResource = httpResource<WorldBankResponse>(() =>
    marketDataEndpoint(COUNTRY, MARKET_RETURN_INDICATOR, YEARS),
  );

  readonly inflationResource = httpResource<WorldBankResponse>(() =>
    marketDataEndpoint(COUNTRY, INFLATION_INDICATOR, YEARS),
  );

  private readonly realReturn = computed(() =>
    realReturnOf(valuesByYear(this.marketReturnResource), valuesByYear(this.inflationResource)),
  );

  /** Compound real (after-inflation) market return, in percent. */
  readonly estimatedAnnualReturn = computed(() =>
    Number((this.realReturn()?.rate ?? DEFAULT_ANNUAL_RETURN).toFixed(1)),
  );

  /** The years the live return was computed over, or null on the baseline. */
  readonly returnPeriod = computed(() => {
    const real = this.realReturn();
    return real ? { from: real.from, to: real.to } : null;
  });

  readonly safeWithdrawalRate = signal(DEFAULT_SAFE_WITHDRAWAL_RATE);

  /** Whether the return came from the live API rather than the baseline. */
  readonly isLive = computed(() => this.realReturn() !== null);

  readonly isLoading = computed(
    () => this.marketReturnResource.isLoading() || this.inflationResource.isLoading(),
  );
}
