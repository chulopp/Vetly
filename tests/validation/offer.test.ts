import { describe, expect, it } from 'vitest';
import { CURRENCY_MESSAGE, OfferInputSchema, zodToIssues } from '@/lib/validation/offer';

const validPayload = {
  budget: 8000,
  currency: 'USD',
  platformFeePercent: 3,
  estimatedHours: 120,
  depositPercent: 50,
  paymentTermsDays: 7,
  allowedRevisions: 2,
  targetRate: 50,
  flags: [],
};

describe('OfferInputSchema — valid input', () => {
  it('parses a complete valid payload unchanged', () => {
    const result = OfferInputSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(validPayload);
  });

  it('normalizes currency: trims and uppercases', () => {
    const result = OfferInputSchema.safeParse({ ...validPayload, currency: '  idr ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.currency).toBe('IDR');
  });

  it('applies defaults for optional inputs (fee/deposit/terms/revisions/flags)', () => {
    const { currency, budget, estimatedHours, targetRate, ...optionalRemoved } = validPayload;
    const result = OfferInputSchema.safeParse({
      budget,
      currency,
      estimatedHours,
      targetRate,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.platformFeePercent).toBe(0);
      expect(result.data.depositPercent).toBe(0);
      expect(result.data.paymentTermsDays).toBe(0);
      expect(result.data.allowedRevisions).toBe(0);
      expect(result.data.flags).toEqual([]);
    }
  });

  it('accepts every boundary-legal value (PRD 3.4 pass cases)', () => {
    expect(OfferInputSchema.safeParse({ ...validPayload, platformFeePercent: 99.99 }).success).toBe(true);
    expect(OfferInputSchema.safeParse({ ...validPayload, depositPercent: 0 }).success).toBe(true);
    expect(OfferInputSchema.safeParse({ ...validPayload, depositPercent: 100 }).success).toBe(true);
    expect(OfferInputSchema.safeParse({ ...validPayload, paymentTermsDays: 0 }).success).toBe(true);
    expect(OfferInputSchema.safeParse({ ...validPayload, paymentTermsDays: 365 }).success).toBe(true);
    expect(OfferInputSchema.safeParse({ ...validPayload, allowedRevisions: 0 }).success).toBe(true);
    expect(OfferInputSchema.safeParse({ ...validPayload, platformFeePercent: 0 }).success).toBe(true);
  });
});

describe('OfferInputSchema — every PRD 3.4 rejection maps to a field-specific message', () => {
  const cases: Array<[string, unknown, string, string]> = [
    ['budget zero', { budget: 0 }, 'budget', 'Budget must be greater than zero.'],
    ['budget negative', { budget: -500 }, 'budget', 'Budget must be greater than zero.'],
    ['budget missing', { budget: undefined }, 'budget', 'Budget is required.'],
    ['budget wrong type', { budget: '8000' }, 'budget', 'Budget must be a number.'],
    ['budget NaN', { budget: Number.NaN }, 'budget', 'Budget must be a number.'],
    ['budget Infinity', { budget: Number.POSITIVE_INFINITY }, 'budget', 'Budget must be a finite number.'],
    ['targetRate zero', { targetRate: 0 }, 'targetRate', 'Target hourly rate must be greater than zero.'],
    ['estimatedHours negative', { estimatedHours: -3 }, 'estimatedHours', 'Estimated hours must be greater than zero.'],
    ['deposit negative', { depositPercent: -1 }, 'depositPercent', 'Deposit must be between 0 and 100 percent.'],
    ['deposit over 100', { depositPercent: 100.01 }, 'depositPercent', 'Deposit must be between 0 and 100 percent.'],
    ['fee negative', { platformFeePercent: -1 }, 'platformFeePercent', 'Platform fee must be 0 or more.'],
    ['fee exactly 100', { platformFeePercent: 100 }, 'platformFeePercent', 'Platform fee must be below 100 percent.'],
    ['fee over 100', { platformFeePercent: 150 }, 'platformFeePercent', 'Platform fee must be below 100 percent.'],
    ['terms negative', { paymentTermsDays: -1 }, 'paymentTermsDays', 'Payment terms must be between 0 and 365 days.'],
    ['terms over 365', { paymentTermsDays: 366 }, 'paymentTermsDays', 'Payment terms must be between 0 and 365 days.'],
    ['revisions negative', { allowedRevisions: -1 }, 'allowedRevisions', 'Allowed revisions must be 0 or more.'],
    ['revisions over 20', { allowedRevisions: 21 }, 'allowedRevisions', 'Allowed revisions must be 20 or fewer.'],
    ['revisions non-integer', { allowedRevisions: 2.5 }, 'allowedRevisions', 'Allowed revisions must be a whole number of 0 or more.'],
    ['currency unknown', { currency: 'XYZ' }, 'currency', CURRENCY_MESSAGE],
    ['currency wrong type', { currency: 123 }, 'currency', CURRENCY_MESSAGE],
    ['currency empty', { currency: '' }, 'currency', CURRENCY_MESSAGE],
    ['flag unknown', { flags: ['made_up_flag'] }, 'flags.0', 'Unknown risk flag.'],
    ['flags wrong type', { flags: 'no_contract' }, 'flags', 'Flags must be an array.'],
  ];

  it.each(cases)('%s -> 400 issue on field "%s"', (_name, patch, field, message) => {
    const result = OfferInputSchema.safeParse({ ...validPayload, ...(patch as Record<string, unknown>) });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = zodToIssues(result.error);
      const match = issues.find((issue) => issue.field === field);
      expect(match, `expected issue on ${field}, got ${JSON.stringify(issues)}`).toBeDefined();
      expect(match?.message).toBe(message);
    }
  });
});

describe('flag dedupe (no double-counting, PRD 3.4)', () => {
  it('a repeated flag collapses to one entry', () => {
    const result = OfferInputSchema.safeParse({ ...validPayload, flags: ['no_contract', 'no_contract', 'vague_scope'] });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.flags).toEqual(['no_contract', 'vague_scope']);
  });
});

describe('zodToIssues', () => {
  it('maps paths to flat field names for the uniform 400 shape', () => {
    const result = OfferInputSchema.safeParse({ budget: -1, currency: 'XYZ' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = zodToIssues(result.error);
      expect(issues).toContainEqual({ field: 'budget', message: 'Budget must be greater than zero.' });
      expect(issues).toContainEqual({ field: 'currency', message: CURRENCY_MESSAGE });
    }
  });
});
