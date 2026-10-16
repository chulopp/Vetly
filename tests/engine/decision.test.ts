import { describe, expect, it } from 'vitest';
import {
  buildCounterOffer,
  ceilToDecimals,
  contractConditions,
  decisionReason,
  floorHours,
  marginBand,
  marginProximity,
  recommendAction,
} from '@/lib/engine/decision';
import type { OfferInput, RiskTier } from '@/lib/engine/types';

const offer = (partial: Partial<OfferInput>): OfferInput => ({
  budget: 8000,
  currency: 'USD',
  platformFeePercent: 3,
  estimatedHours: 120,
  depositPercent: 50,
  paymentTermsDays: 7,
  allowedRevisions: 2,
  targetRate: 50,
  flags: [],
  ...partial,
});

describe('marginBand (PRD 3.2 C boundaries)', () => {
  it('assigns bands at the exact thresholds', () => {
    expect(marginBand(20)).toBe('HIGH_SURPLUS');
    expect(marginBand(19.99)).toBe('FAIR');
    expect(marginBand(0)).toBe('FAIR');
    expect(marginBand(-0.01)).toBe('DEFICIT');
    expect(marginBand(-61.2)).toBe('DEFICIT');
  });
});

describe('marginProximity (boundary-proximity display)', () => {
  it('shows distance to the next threshold instead of a bare cliff', () => {
    expect(marginProximity(30.44)).toEqual({
      threshold: '+20% surplus',
      direction: 'above',
      points: 10.44,
      message: '10.44 pp above the +20% surplus threshold',
    });
    expect(marginProximity(17.58)).toEqual({
      threshold: '+20% surplus',
      direction: 'below',
      points: 2.42,
      message: '2.42 pp below the +20% surplus threshold',
    });
    expect(marginProximity(0)).toEqual({
      threshold: '+20% surplus',
      direction: 'below',
      points: 20,
      message: '20 pp below the +20% surplus threshold',
    });
    expect(marginProximity(-61.2)).toEqual({
      threshold: 'break-even',
      direction: 'below',
      points: 61.2,
      message: '61.2 pp below break-even',
    });
  });
});

describe('recommendAction (the full 3x3 decision matrix)', () => {
  const matrix: Array<[ReturnType<typeof marginBand>, RiskTier, string]> = [
    ['HIGH_SURPLUS', 'LOW', 'ACCEPT'],
    ['HIGH_SURPLUS', 'MEDIUM', 'NEGOTIATE'],
    ['HIGH_SURPLUS', 'HIGH', 'NEGOTIATE'],
    ['FAIR', 'LOW', 'ACCEPT'],
    ['FAIR', 'MEDIUM', 'NEGOTIATE'],
    ['FAIR', 'HIGH', 'REJECT'],
    ['DEFICIT', 'LOW', 'NEGOTIATE'],
    ['DEFICIT', 'MEDIUM', 'REJECT'],
    ['DEFICIT', 'HIGH', 'REJECT'],
  ];

  it.each(matrix)('%s margin + %s risk -> %s', (band, tier, action) => {
    expect(recommendAction(band, tier)).toBe(action);
  });
});

describe('decisionReason', () => {
  it('returns a non-empty reason for every matrix cell', () => {
    for (const [band] of [['HIGH_SURPLUS'], ['FAIR'], ['DEFICIT']] as const) {
      for (const tier of ['LOW', 'MEDIUM', 'HIGH'] as const) {
        expect(decisionReason(band, tier, 12.34).length).toBeGreaterThan(10);
      }
    }
  });

  it('interpolates the margin deterministically', () => {
    expect(decisionReason('FAIR', 'LOW', 17.58)).toBe(
      'The rate meets your target (+17.58%) and client risk is LOW — safe to accept.',
    );
    expect(decisionReason('DEFICIT', 'HIGH', -61.2)).toBe(
      'The effective rate is 61.2% below your target and client risk is HIGH — reject this one.',
    );
  });
});

describe('ceilToDecimals', () => {
  it('ceils to the requested decimals without float artifacts', () => {
    expect(ceilToDecimals(3866.666666666667, 2)).toBe(3866.67);
    expect(ceilToDecimals(120987.9, 0)).toBe(120988);
    expect(ceilToDecimals(10.001, 0)).toBe(11);
    expect(ceilToDecimals(6.7, 1)).toBe(6.7);
    expect(ceilToDecimals(5.555, 3)).toBe(5.555);
    expect(ceilToDecimals(100, 2)).toBe(100);
  });
});

describe('floorHours', () => {
  it('floors to whole hours with an artifact guard', () => {
    expect(floorHours(31.03448275862069)).toBe(31);
    expect(floorHours(30.999999999999)).toBe(31);
    expect(floorHours(31.000000000001)).toBe(31);
    expect(floorHours(0.5)).toBe(0);
  });
});

describe('contractConditions (exact PRD strings, in PRD order)', () => {
  it('deposit under 25% requires a deposit', () => {
    expect(contractConditions(offer({ depositPercent: 24.99 }))).toEqual([
      'Require minimum 25–50% upfront deposit.',
    ]);
  });

  it('revisions over 2 (or unlimited) cap revisions', () => {
    expect(contractConditions(offer({ allowedRevisions: 3 }))).toEqual([
      'Cap revisions strictly at 2 rounds.',
    ]);
    expect(contractConditions(offer({ allowedRevisions: 2, flags: ['unlimited_revisions'] }))).toEqual([
      'Cap revisions strictly at 2 rounds.',
    ]);
  });

  it('the no_contract flag requires a signed SOW', () => {
    expect(contractConditions(offer({ flags: ['no_contract'] }))).toEqual([
      'Require a signed Scope of Work (SOW) before starting.',
    ]);
  });

  it('a clean deal produces no conditions', () => {
    expect(contractConditions(offer({ depositPercent: 25, allowedRevisions: 2 }))).toEqual([]);
  });

  it('stacks all three conditions in PRD order', () => {
    expect(
      contractConditions(offer({ depositPercent: 0, allowedRevisions: 5, flags: ['no_contract', 'unlimited_revisions'] })),
    ).toEqual([
      'Require minimum 25–50% upfront deposit.',
      'Cap revisions strictly at 2 rounds.',
      'Require a signed Scope of Work (SOW) before starting.',
    ]);
  });
});

describe('buildCounterOffer (locked matrix-consistent semantics)', () => {
  it('ACCEPT cells never carry a counter-offer', () => {
    // high surplus + LOW risk
    expect(buildCounterOffer(offer({ budget: 8500, platformFeePercent: 0 }), { band: 'HIGH_SURPLUS', tier: 'LOW', action: 'ACCEPT' })).toBeNull();
    // fair margin + LOW risk (the Ideal SaaS MVP preset shape)
    expect(buildCounterOffer(offer({}), { band: 'FAIR', tier: 'LOW', action: 'ACCEPT' })).toBeNull();
  });

  it('high surplus + MEDIUM/HIGH risk: risk terms only, no budget numbers', () => {
    const counter = buildCounterOffer(offer({ budget: 8500, platformFeePercent: 0, paymentTermsDays: 90 }), { band: 'HIGH_SURPLUS', tier: 'MEDIUM', action: 'NEGOTIATE' });
    expect(counter).toEqual({
      budgetTriggered: false,
      suggestedBudget: null,
      maxExecutableHours: null,
      riskTriggered: true,
      contractConditions: [],
    });
    const counterHigh = buildCounterOffer(
      offer({ budget: 8500, platformFeePercent: 0, paymentTermsDays: 90, flags: ['no_contract', 'unlimited_revisions'] }),
      { band: 'HIGH_SURPLUS', tier: 'HIGH', action: 'NEGOTIATE' },
    );
    expect(counterHigh?.budgetTriggered).toBe(false);
    expect(counterHigh?.riskTriggered).toBe(true);
    expect(counterHigh?.contractConditions).toEqual([
      'Cap revisions strictly at 2 rounds.',
      'Require a signed Scope of Work (SOW) before starting.',
    ]);
  });

  it('fair margin + MEDIUM risk (NEGOTIATE): both budget numbers and contract conditions', () => {
    const counter = buildCounterOffer(offer({ paymentTermsDays: 90 }), { band: 'FAIR', tier: 'MEDIUM', action: 'NEGOTIATE' });
    expect(counter?.budgetTriggered).toBe(true);
    expect(counter?.suggestedBudget).toBe(6804.13);
    expect(counter?.maxExecutableHours).toBe(141);
    expect(counter?.riskTriggered).toBe(true);
    expect(counter?.contractConditions).toEqual([]);
  });

  it('fair margin + HIGH risk (REJECT driven by risk): contract conditions only — the PRD worked example', () => {
    const counter = buildCounterOffer(
      offer({ paymentTermsDays: 90, flags: ['no_contract', 'first_time_client'] }),
      { band: 'FAIR', tier: 'HIGH', action: 'REJECT' },
    );
    expect(counter?.budgetTriggered).toBe(false);
    expect(counter?.suggestedBudget).toBeNull();
    expect(counter?.maxExecutableHours).toBeNull();
    expect(counter?.riskTriggered).toBe(true);
    expect(counter?.contractConditions).toEqual(['Require a signed Scope of Work (SOW) before starting.']);
  });

  it('deficit + LOW risk: budget numbers only (no revision penalty: 2 free revisions)', () => {
    const counter = buildCounterOffer(
      offer({ budget: 1500, platformFeePercent: 10, estimatedHours: 80, targetRate: 30 }),
      { band: 'DEFICIT', tier: 'LOW', action: 'NEGOTIATE' },
    );
    expect(counter).toEqual({
      budgetTriggered: true,
      suggestedBudget: 2933.34, // ceil2(30 × 88 adjusted hours / (1 − 10% fee))
      maxExecutableHours: 40, // floor(1350 net / (30 × 1.1))
      riskTriggered: false,
      contractConditions: [],
    });
  });

  it('deficit + MEDIUM/HIGH risk: both corrections apply', () => {
    const counter = buildCounterOffer(
      offer({ budget: 1500, platformFeePercent: 10, estimatedHours: 80, targetRate: 30, paymentTermsDays: 90 }),
      { band: 'DEFICIT', tier: 'MEDIUM', action: 'REJECT' },
    );
    expect(counter?.budgetTriggered).toBe(true);
    expect(counter?.suggestedBudget).toBe(2933.34);
    expect(counter?.maxExecutableHours).toBe(40);
    expect(counter?.riskTriggered).toBe(true);

    const counterHigh = buildCounterOffer(
      offer({
        budget: 1500,
        platformFeePercent: 10,
        estimatedHours: 80,
        depositPercent: 0,
        paymentTermsDays: 30,
        targetRate: 30,
        flags: ['unlimited_revisions', 'vague_scope', 'no_contract'],
      }),
      { band: 'DEFICIT', tier: 'HIGH', action: 'REJECT' },
    );
    expect(counterHigh?.budgetTriggered).toBe(true);
    expect(counterHigh?.suggestedBudget).toBe(3866.67);
    expect(counterHigh?.maxExecutableHours).toBe(31);
    expect(counterHigh?.riskTriggered).toBe(true);
    expect(counterHigh?.contractConditions).toEqual([
      'Require minimum 25–50% upfront deposit.',
      'Cap revisions strictly at 2 rounds.',
      'Require a signed Scope of Work (SOW) before starting.',
    ]);
  });

  it('ceils the suggested budget to the currency conventional decimals (JPY: 0)', () => {
    const counter = buildCounterOffer(
      offer({ budget: 100000, currency: 'JPY', platformFeePercent: 0, estimatedHours: 33, targetRate: 3333 }),
      { band: 'DEFICIT', tier: 'LOW', action: 'NEGOTIATE' },
    );
    expect(counter?.suggestedBudget).toBe(120988);
    expect(counter?.maxExecutableHours).toBe(27);
  });
});
