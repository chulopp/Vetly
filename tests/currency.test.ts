import { describe, expect, it } from 'vitest';
import { CURRENCIES, decimalsForCurrency, formatMoney, isSupportedCurrency } from '@/lib/currency';

describe('the bundled ISO 4217 list (PRD 3.8)', () => {
  it('covers the PRD-named currencies and at least 150 codes', () => {
    expect(CURRENCIES.length).toBeGreaterThanOrEqual(150);
    for (const code of ['USD', 'EUR', 'GBP', 'IDR', 'SGD', 'AUD', 'INR', 'JPY']) {
      expect(isSupportedCurrency(code)).toBe(true);
    }
  });

  it('carries conventional decimal places (0 for JPY/IDR, 3 for KWD)', () => {
    expect(decimalsForCurrency('JPY')).toBe(0);
    expect(decimalsForCurrency('IDR')).toBe(0);
    expect(decimalsForCurrency('KRW')).toBe(0);
    expect(decimalsForCurrency('USD')).toBe(2);
    expect(decimalsForCurrency('EUR')).toBe(2);
    expect(decimalsForCurrency('KWD')).toBe(3);
  });

  it('recognizes codes case-insensitively and rejects unknown ones', () => {
    expect(isSupportedCurrency('usd')).toBe(true);
    expect(isSupportedCurrency(' IDR ')).toBe(true);
    expect(isSupportedCurrency('XYZ')).toBe(false);
    expect(isSupportedCurrency('')).toBe(false);
  });

  it('falls back to 2 decimals for unknown codes', () => {
    expect(decimalsForCurrency('XYZ')).toBe(2);
  });
});

describe('formatMoney (deterministic en-US Intl output)', () => {
  it('formats USD with 2 decimals', () => {
    expect(formatMoney(58.79, 'USD')).toBe('$58.79');
    expect(formatMoney(3866.67, 'USD')).toBe('$3,866.67');
  });

  it('formats 0-decimal currencies conventionally (PRD 3.4 rounding)', () => {
    expect(formatMoney(2754.82, 'JPY')).toBe('¥2,755');
    // Intl renders an unknown-symbol currency as "CODE\u00A0amount" (non-breaking space)
    expect(formatMoney(1234567, 'IDR')).toBe('IDR\u00A01,234,567');
  });

  it('is deterministic across repeated calls', () => {
    expect(formatMoney(260.87, 'USD')).toBe(formatMoney(260.87, 'USD'));
  });
});
