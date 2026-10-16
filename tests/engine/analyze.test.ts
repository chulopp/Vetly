import { describe, expect, it } from 'vitest';
import { analyzeOffer } from '@/lib/engine';
import type { OfferInput } from '@/lib/engine/types';

/** Preset scenario "Ideal SaaS MVP" (locked plan decision #4). */
const idealSaasMvp: OfferInput = {
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

/** Preset scenario "Scope Creep Trap". */
const scopeCreepTrap: OfferInput = {
  budget: 1500,
  currency: 'USD',
  platformFeePercent: 10,
  estimatedHours: 80,
  depositPercent: 0,
  paymentTermsDays: 30,
  allowedRevisions: 2,
  targetRate: 30,
  flags: ['unlimited_revisions', 'vague_scope', 'no_contract'],
};

/** Preset scenario "High-Pay Corporate Net-90". */
const corporateNet90: OfferInput = {
  budget: 18000,
  currency: 'USD',
  platformFeePercent: 0,
  estimatedHours: 60,
  depositPercent: 25,
  paymentTermsDays: 90,
  allowedRevisions: 3,
  targetRate: 200,
  flags: [],
};

describe('analyzeOffer — preset "Ideal SaaS MVP" (ACCEPT path)', () => {
  const result = analyzeOffer(idealSaasMvp);

  it('computes the effective rate and margin exactly', () => {
    expect(result.netBudget).toBe(7760);
    expect(result.adjustedHours).toBe(132);
    expect(result.revisionPenalty).toBe(0);
    expect(result.effectiveHourlyRate).toBe(58.79);
    expect(result.profitabilityMargin).toBe(17.58);
    expect(result.marginBand).toBe('FAIR');
  });

  it('computes risk exactly', () => {
    expect(result.riskScore).toBe(0);
    expect(result.riskTier).toBe('LOW');
    expect(result.riskContributions.map((c) => c.points)).toEqual([0, 0]);
  });

  it('recommends ACCEPT with a deterministic reason and no counter-offer', () => {
    expect(result.recommendAction).toBe('ACCEPT');
    expect(result.decisionReason).toBe('The rate meets your target (+17.58%) and client risk is LOW — safe to accept.');
    expect(result.counterOffer).toBeNull();
  });

  it('shows boundary proximity for both margin and risk', () => {
    expect(result.marginProximity.message).toBe('2.42 pp below the +20% surplus threshold');
    expect(result.riskProximity).toEqual({ nextTier: 'MEDIUM', points: 31, message: '31 points from MEDIUM' });
  });
});

describe('analyzeOffer — preset "Scope Creep Trap" (REJECT path)', () => {
  const result = analyzeOffer(scopeCreepTrap);

  it('applies the +35% unlimited-revision lockout and 10% platform fee', () => {
    expect(result.revisionPenalty).toBe(0.35);
    expect(result.netBudget).toBe(1350);
    expect(result.adjustedHours).toBe(116);
    expect(result.effectiveHourlyRate).toBe(11.64);
    expect(result.profitabilityMargin).toBe(-61.2);
    expect(result.marginBand).toBe('DEFICIT');
  });

  it('scores the risk at 100/HIGH with every factor contributing', () => {
    expect(result.riskScore).toBe(100);
    expect(result.riskTier).toBe('HIGH');
    expect(result.riskContributions.map((c) => c.points)).toEqual([30, 10, 25, 20, 15]); // canonical flag order: no_contract, vague_scope, unlimited_revisions
    expect(result.riskProximity.message).toBe('At the maximum risk score (100)');
  });

  it('recommends REJECT and generates the full counter-offer (both corrections)', () => {
    expect(result.recommendAction).toBe('REJECT');
    expect(result.decisionReason).toBe('The effective rate is 61.2% below your target and client risk is HIGH — reject this one.');
    expect(result.counterOffer).toEqual({
      budgetTriggered: true,
      suggestedBudget: 3866.67,
      maxExecutableHours: 31,
      riskTriggered: true,
      contractConditions: [
        'Require minimum 25–50% upfront deposit.',
        'Cap revisions strictly at 2 rounds.',
        'Require a signed Scope of Work (SOW) before starting.',
      ],
    });
    expect(result.marginProximity.message).toBe('61.2 pp below break-even');
  });
});

describe('analyzeOffer — preset "High-Pay Corporate Net-90" (NEGOTIATE path, risk-driven)', () => {
  const result = analyzeOffer(corporateNet90);

  it('computes the +5% revision penalty (3 revisions) and the exact rate', () => {
    expect(result.revisionPenalty).toBe(0.05);
    expect(result.netBudget).toBe(18000);
    expect(result.adjustedHours).toBe(69);
    expect(result.effectiveHourlyRate).toBe(260.87);
  });

  it('lands in high surplus + MEDIUM risk -> NEGOTIATE with risk terms only', () => {
    expect(result.marginBand).toBe('HIGH_SURPLUS');
    expect(result.riskScore).toBe(45);
    expect(result.riskTier).toBe('MEDIUM');
    expect(result.recommendAction).toBe('NEGOTIATE');
    expect(result.riskProximity).toEqual({ nextTier: 'HIGH', points: 16, message: '16 points from HIGH' });
    expect(result.counterOffer).toEqual({
      budgetTriggered: false,
      suggestedBudget: null,
      maxExecutableHours: null,
      riskTriggered: true,
      contractConditions: ['Cap revisions strictly at 2 rounds.'],
    });
  });
});

describe('analyzeOffer — determinism and edge cases', () => {
  it('is a pure function: identical input, deeply identical output', () => {
    expect(analyzeOffer(scopeCreepTrap)).toEqual(analyzeOffer(scopeCreepTrap));
  });

  it('echoes the input back for storage and duplicate & edit', () => {
    expect(analyzeOffer(idealSaasMvp).input).toEqual(idealSaasMvp);
  });

  it('never divides by zero: validation rejects non-positive hours before the engine runs', () => {
    // The engine itself assumes validated input (estimatedHours > 0, fee < 100);
    // this documents the contract that prevents Infinity/NaN (PRD 3.4).
    expect(Number.isFinite(analyzeOffer({ ...idealSaasMvp, platformFeePercent: 99.99 }).effectiveHourlyRate)).toBe(true);
  });

  it('caps the risk score at 100 when every risk factor is maxed', () => {
    const result = analyzeOffer({
      ...idealSaasMvp,
      depositPercent: 0,
      paymentTermsDays: 365,
      flags: ['no_contract', 'vague_scope', 'unlimited_revisions', 'first_time_client'],
    });
    expect(result.riskScore).toBe(100); // raw 135 -> min(100, 135)
    expect(result.riskTier).toBe('HIGH');
  });

  it('a tiny budget can yield 0 max executable hours (floor), never a negative number', () => {
    const result = analyzeOffer({ ...idealSaasMvp, budget: 10, targetRate: 1000 });
    expect(result.counterOffer?.maxExecutableHours).toBe(0);
  });
});
