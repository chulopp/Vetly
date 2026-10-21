import { describe, expect, it } from 'vitest';
import { analyzeOffer } from '@/lib/engine';
import { generateVerdictSummary } from '@/lib/summary';
import type { OfferInput } from '@/lib/engine/types';

describe('generateVerdictSummary', () => {
  it('generates deficit summary for NEGOTIATE with risk drivers without em-dashes', () => {
    const input: OfferInput = {
      budget: 5000000,
      currency: 'IDR',
      platformFeePercent: 0,
      estimatedHours: 10,
      depositPercent: 0,
      paymentTermsDays: 45,
      allowedRevisions: 2,
      targetRate: 500000,
      flags: ['first_time_client'],
    };
    const analysis = analyzeOffer(input);
    const summary = generateVerdictSummary({ input, analysis });

    expect(summary).not.toContain('—');
    expect(summary).toContain('less per hour than you need');
    expect(summary).toContain('deficit');
  });

  it('generates accept summary for safe high-paying deal', () => {
    const input: OfferInput = {
      budget: 10000000,
      currency: 'IDR',
      platformFeePercent: 0,
      estimatedHours: 10,
      depositPercent: 50,
      paymentTermsDays: 0,
      allowedRevisions: 1,
      targetRate: 500000,
      flags: [],
    };
    const analysis = analyzeOffer(input);
    const summary = generateVerdictSummary({ input, analysis });

    expect(summary).not.toContain('—');
    expect(summary).toContain('more per hour than your target');
    expect(summary).toContain('surplus');
    expect(summary).toContain('safe and ready to accept');
  });

  it('generates risk-driven negotiate summary when rate clears target', () => {
    const input: OfferInput = {
      budget: 6000000,
      currency: 'IDR',
      platformFeePercent: 0,
      estimatedHours: 10,
      depositPercent: 0,
      paymentTermsDays: 30,
      allowedRevisions: 3,
      targetRate: 500000,
      flags: ['first_time_client'],
    };
    const analysis = analyzeOffer(input);
    const summary = generateVerdictSummary({ input, analysis });

    expect(summary).not.toContain('—');
    expect(summary).toContain('surplus');
    expect(summary).toContain('client risk is');
  });
});
