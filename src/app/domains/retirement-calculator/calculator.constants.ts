/**
 * Baseline retirement assumptions, used until live macroeconomic data resolves
 * and as the fallback when it fails. Every rate is a percentage (e.g. `2.5` = 2.5%).
 */

/** Historical nominal stock market return. */
export const DEFAULT_ANNUAL_RETURN = 7;

/** Trinity Study baseline safe withdrawal rate. */
export const DEFAULT_SAFE_WITHDRAWAL_RATE = 4;

/** Long-run consumer price inflation. */
export const DEFAULT_INFLATION = 2.5;

export const MONTHS_PER_YEAR = 12;
