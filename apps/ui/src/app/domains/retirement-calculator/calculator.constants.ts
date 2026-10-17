/**
 * Baseline retirement assumptions, used until live macroeconomic data resolves
 * and as the fallback when it fails. Every rate is a percentage (e.g. `2.5` = 2.5%).
 */

/**
 * Real (after-inflation) US stock return: the 1995–2024 compound figure the live
 * data produces, rounded. Price index only, no dividends, so it errs low.
 */
export const DEFAULT_ANNUAL_RETURN = 6;

/** Trinity Study baseline safe withdrawal rate. */
export const DEFAULT_SAFE_WITHDRAWAL_RATE = 4;

/** Long-run real US stock return; anything above it is a best case. */
export const LONG_RUN_REAL_RETURN = 7;

export const MONTHS_PER_YEAR = 12;

/** Valid ranges for each input; the template's min/max mirror these. */
export const INPUT_BOUNDS = {
  years: { min: 1, max: 80 },
  annualReturn: { min: -5, max: 15 },
  withdrawalRate: { min: 0.5, max: 10 },
} as const;

/**
 * The currency each locale build shows, with a plausible monthly target in it
 * (a starting point the visitor edits, not a converted dollar figure).
 */
export const CURRENCY_BY_LANGUAGE: Record<string, { code: string; monthlyIncome: number }> = {
  en: { code: 'USD', monthlyIncome: 4000 },
  de: { code: 'EUR', monthlyIncome: 3000 },
  th: { code: 'THB', monthlyIncome: 40000 },
};
