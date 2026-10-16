import {
  OVERHEAD_RATE,
  REVISION_FREE_BASE,
  REVISION_PENALTY_PER_REVISION,
  UNLIMITED_REVISION_PENALTY,
} from './constants';
import type { OfferFlag } from './types';

/**
 * Deterministic rounding to 2 decimals (PRD §3.2 A).
 * IEEE-754 arithmetic is identical across environments, so this is stable
 * everywhere; the Number.EPSILON nudge absorbs representation noise around
 * the .5 boundary for positive values.
 */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Revision penalty as a fraction of additional hours (PRD §3.2 A):
 * - unlimited_revisions flag active -> locked flat +35% (overrides everything)
 * - > 2 revisions -> +5% per revision beyond 2
 * - 0–2 revisions -> 0
 */
export function revisionPenaltyHours(allowedRevisions: number, flags: readonly OfferFlag[]): number {
  if (flags.includes('unlimited_revisions')) {
    return UNLIMITED_REVISION_PENALTY;
  }
  if (allowedRevisions > REVISION_FREE_BASE) {
    return (allowedRevisions - REVISION_FREE_BASE) * REVISION_PENALTY_PER_REVISION;
  }
  return 0;
}

/** Net Budget = Budget × (1 − platformFeePercent / 100). */
export function netBudget(budget: number, platformFeePercent: number): number {
  return budget * (1 - platformFeePercent / 100);
}

/** Adjusted Hours = Estimated Hours × (1 + 0.10 + Revision Penalty). */
export function adjustedHours(estimatedHours: number, revisionPenalty: number): number {
  return estimatedHours * (1 + OVERHEAD_RATE + revisionPenalty);
}

/** Effective Hourly Rate = round(Net Budget / Adjusted Hours, 2). */
export function effectiveHourlyRate(net: number, adjusted: number): number {
  return round2(net / adjusted);
}

/** Profitability Margin (%) = round((Effective Rate − Target Rate) / Target Rate × 100, 2) — computed from the already-rounded effective rate. */
export function profitabilityMargin(effectiveRate: number, targetRate: number): number {
  return round2(((effectiveRate - targetRate) / targetRate) * 100);
}
