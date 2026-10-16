import { decimalsForCurrency } from '@/lib/currency';
import { MARGIN_SURPLUS_THRESHOLD, OVERHEAD_RATE } from './constants';
import { formatMargin, trimNumber } from './format';
import { adjustedHours, netBudget, round2, revisionPenaltyHours } from './rate';
import type { CounterOffer, MarginBand, MarginProximity, OfferInput, RecommendAction, RiskTier } from './types';

/** Margin bands (PRD §3.2 C): >= +20% high surplus | 0 ≤ m < +20% fair | < 0% deficit. */
export function marginBand(margin: number): MarginBand {
  if (margin >= MARGIN_SURPLUS_THRESHOLD) return 'HIGH_SURPLUS';
  if (margin >= 0) return 'FAIR';
  return 'DEFICIT';
}

/**
 * Boundary-proximity display for the margin (PRD §3.5.2): distance to the next
 * threshold (break-even 0% / the +20% surplus line) instead of a bare cliff.
 */
export function marginProximity(margin: number): MarginProximity {
  if (margin >= MARGIN_SURPLUS_THRESHOLD) {
    const points = round2(margin - MARGIN_SURPLUS_THRESHOLD);
    return {
      threshold: '+20% surplus',
      direction: 'above',
      points,
      message: `${trimNumber(points)} pp above the +20% surplus threshold`,
    };
  }
  if (margin >= 0) {
    const points = round2(MARGIN_SURPLUS_THRESHOLD - margin);
    return {
      threshold: '+20% surplus',
      direction: 'below',
      points,
      message: `${trimNumber(points)} pp below the +20% surplus threshold`,
    };
  }
  const points = round2(-margin);
  return {
    threshold: 'break-even',
    direction: 'below',
    points,
    message: `${trimNumber(points)} pp below break-even`,
  };
}

/** 3×3 decision matrix (PRD §3.2 C) — margin band × risk tier. */
const DECISION_MATRIX: Record<MarginBand, Record<RiskTier, RecommendAction>> = {
  HIGH_SURPLUS: { LOW: 'ACCEPT', MEDIUM: 'NEGOTIATE', HIGH: 'NEGOTIATE' },
  FAIR: { LOW: 'ACCEPT', MEDIUM: 'NEGOTIATE', HIGH: 'REJECT' },
  DEFICIT: { LOW: 'NEGOTIATE', MEDIUM: 'REJECT', HIGH: 'REJECT' },
};

export function recommendAction(band: MarginBand, tier: RiskTier): RecommendAction {
  return DECISION_MATRIX[band][tier];
}

/** One-line deterministic reason per matrix cell, with the margin interpolated. */
export function decisionReason(band: MarginBand, tier: RiskTier, margin: number): string {
  const m = formatMargin(margin);
  const below = trimNumber(-margin);
  switch (band) {
    case 'HIGH_SURPLUS':
      if (tier === 'LOW') return `Comfortable surplus (${m}% above your target rate) with LOW client risk — a clear accept.`;
      if (tier === 'MEDIUM') return `The rate clears your target (${m}%) but client risk is MEDIUM — negotiate the risk terms before accepting.`;
      return `The rate clears your target (${m}%) but client risk is HIGH — require a deposit and a signed contract before accepting.`;
    case 'FAIR':
      if (tier === 'LOW') return `The rate meets your target (${m}%) and client risk is LOW — safe to accept.`;
      if (tier === 'MEDIUM') return `The rate barely clears your target (${m}%) and client risk is MEDIUM — raise the price or tighten the terms before accepting.`;
      return `The budget was fine (${m}%) but client risk is HIGH — reject as-is unless the client fixes the risk terms.`;
    default:
      if (tier === 'LOW') return `The effective rate is ${below}% below your target — counter with a higher budget or commit to fewer hours.`;
      if (tier === 'MEDIUM') return `The effective rate is ${below}% below your target and client risk is MEDIUM — this deal does not work as offered.`;
      return `The effective rate is ${below}% below your target and client risk is HIGH — reject this one.`;
  }
}

/** Ceil to a fixed number of decimals (PRD §3.4 currency rounding); relative epsilon avoids float artifacts at any currency magnitude. */
export function ceilToDecimals(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.ceil(value * factor * (1 - 1e-12)) / factor;
}

/** Floor to whole hours with a float-artifact guard. */
export function floorHours(value: number): number {
  return Math.floor(value * (1 + 1e-12));
}

/** Exact PRD condition strings, in PRD order. */
export function contractConditions(input: Pick<OfferInput, 'depositPercent' | 'allowedRevisions' | 'flags'>): string[] {
  const conditions: string[] = [];
  if (input.depositPercent < 25) {
    conditions.push('Require minimum 25–50% upfront deposit.');
  }
  if (input.allowedRevisions > 2 || input.flags.includes('unlimited_revisions')) {
    conditions.push('Cap revisions strictly at 2 rounds.');
  }
  if (input.flags.includes('no_contract')) {
    conditions.push('Require a signed Scope of Work (SOW) before starting.');
  }
  return conditions;
}

/**
 * Counter-Offer Generator (PRD §3.2 C + locked plan decision #1).
 *
 * Budget-side numbers are computed whenever the margin is the problem:
 * margin < 0, OR a fair margin (0 ≤ m < +20%) while the decision is NEGOTIATE.
 * Contract conditions are computed whenever the risk is the problem:
 * tier MEDIUM or HIGH, regardless of margin.
 *
 * This is the only reading consistent with the PRD's 3×3 matrix and both its
 * worked examples: ACCEPT never carries a counter-offer; a fair margin with
 * HIGH risk (REJECT driven by risk) gets contract conditions only; deficit
 * cells always get budget numbers.
 */
export function buildCounterOffer(
  input: OfferInput,
  context: { band: MarginBand; tier: RiskTier; action: RecommendAction },
): CounterOffer | null {
  const budgetTriggered =
    context.band === 'DEFICIT' || (context.band === 'FAIR' && context.action === 'NEGOTIATE');
  const riskTriggered = context.tier === 'MEDIUM' || context.tier === 'HIGH';
  if (!budgetTriggered && !riskTriggered) return null;

  let suggestedBudget: number | null = null;
  let maxExecutableHours: number | null = null;

  if (budgetTriggered) {
    const penalty = revisionPenaltyHours(input.allowedRevisions, input.flags);
    const adjusted = adjustedHours(input.estimatedHours, penalty);
    const net = netBudget(input.budget, input.platformFeePercent);
    const feeFactor = 1 - input.platformFeePercent / 100;

    // The minimum budget that makes the effective rate exactly hit the target,
    // ceiled to the currency's conventional decimal places (locked decision #5).
    suggestedBudget = ceilToDecimals(
      (input.targetRate * adjusted) / feeFactor,
      decimalsForCurrency(input.currency),
    );

    // The most raw hours that should be spent at the current budget to still hit the target.
    maxExecutableHours = floorHours(net / (input.targetRate * (1 + OVERHEAD_RATE + penalty)));
  }

  return {
    budgetTriggered,
    suggestedBudget,
    maxExecutableHours,
    riskTriggered,
    contractConditions: riskTriggered ? contractConditions(input) : [],
  };
}
