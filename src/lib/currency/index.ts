import currencyData from './iso4217.json';

export interface CurrencyInfo {
  code: string;
  name: string;
  /**
   * Conventional decimal places used for display and for ceiling the suggested
   * budget (PRD §3.4/§3.8) — e.g. 2 for USD/EUR, 0 for JPY/IDR/KRW/VND, 3 for
   * KWD/BHD-class currencies. Statically bundled: zero runtime dependencies.
   */
  decimals: number;
}

/** The curated, static list of active ISO 4217 currencies (~155 codes). */
export const CURRENCIES: CurrencyInfo[] = currencyData;

export const CURRENCY_CODES: string[] = CURRENCIES.map((c) => c.code);

const byCode = new Map<string, CurrencyInfo>(CURRENCIES.map((c) => [c.code, c]));

export function isSupportedCurrency(code: string): boolean {
  return byCode.has(code.trim().toUpperCase());
}

export function currencyInfo(code: string): CurrencyInfo | undefined {
  return byCode.get(code.trim().toUpperCase());
}

export function decimalsForCurrency(code: string): number {
  return currencyInfo(code)?.decimals ?? 2;
}

/**
 * Formats an amount in its offer's native currency using Intl.NumberFormat
 * (PRD §3.8). The locale is pinned to en-US so output strings are deterministic
 * across server, client, and tests — and each formatter is memoized per
 * currency, so repeated calls are guaranteed identical and cheap. Falls back
 * to a plain string for codes Intl cannot render (never happens for
 * validated input).
 */
const formatterCache = new Map<string, Intl.NumberFormat>();

export function formatMoney(amount: number, code: string): string {
  const decimals = decimalsForCurrency(code);
  const upper = code.trim().toUpperCase();
  const cacheKey = `${upper}:${decimals}`;
  let formatter = formatterCache.get(cacheKey);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: upper,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    formatterCache.set(cacheKey, formatter);
  }
  try {
    return formatter.format(amount);
  } catch {
    return `${upper} ${amount.toFixed(decimals)}`;
  }
}
