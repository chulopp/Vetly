import {
  DEPOSIT_POINTS,
  FLAG_DETAILS,
  FLAG_LABELS,
  FLAG_POINTS,
  PAYMENT_TERMS_POINTS,
  RISK_SCORE_MAX,
  RISK_TIER_LOW_MAX,
  RISK_TIER_MEDIUM_MAX,
} from './constants';
import { trimNumber } from './format';
import { OFFER_FLAGS, type OfferFlag, type OfferInput, type RiskContribution, type RiskTier, type TierProximity } from './types';

export type RiskInput = Pick<OfferInput, 'depositPercent' | 'paymentTermsDays' | 'flags'>;

/**
 * Deposit points (PRD §3.2 B) — precise intervals, not decimal-cutoff shorthand:
 * >= 50 -> 0 | >= 25 && < 50 -> 10 | > 0 && < 25 -> 20 | == 0 -> 30.
 */
export function depositPoints(depositPercent: number): number {
  if (depositPercent >= 50) return DEPOSIT_POINTS.atLeast50;
  if (depositPercent >= 25) return DEPOSIT_POINTS.from25To50;
  if (depositPercent > 0) return DEPOSIT_POINTS.under25;
  return DEPOSIT_POINTS.zero;
}

/**
 * Payment terms points (PRD §3.2 B):
 * 0–7 days -> 0 | 8–30 days -> 10 | 31–60 days -> 20 | > 60 days -> 35.
 * Defined on the reals ((7, 30], (30, 60]) so fractional inputs resolve
 * deterministically; for integers these reduce exactly to the PRD brackets.
 */
export function paymentTermsPoints(paymentTermsDays: number): number {
  if (paymentTermsDays <= 7) return PAYMENT_TERMS_POINTS.within7Days;
  if (paymentTermsDays <= 30) return PAYMENT_TERMS_POINTS.from8To30Days;
  if (paymentTermsDays <= 60) return PAYMENT_TERMS_POINTS.from31To60Days;
  return PAYMENT_TERMS_POINTS.over60Days;
}

export function flagPoints(flag: OfferFlag): number {
  return FLAG_POINTS[flag];
}

/** Per-factor risk contributions in canonical order: deposit, payment terms, then each active flag. */
export function riskContributions(input: RiskInput): RiskContribution[] {
  const contributions: RiskContribution[] = [
    {
      source: 'deposit',
      label: 'Upfront deposit',
      detail: input.depositPercent > 0 ? `${trimNumber(input.depositPercent)}% upfront` : 'No upfront deposit',
      points: depositPoints(input.depositPercent),
    },
    {
      source: 'paymentTerms',
      label: 'Payment terms',
      detail: input.paymentTermsDays === 0 ? 'Due upfront (net 0)' : `Net ${trimNumber(input.paymentTermsDays)} days`,
      points: paymentTermsPoints(input.paymentTermsDays),
    },
  ];
  for (const flag of OFFER_FLAGS) {
    if (input.flags.includes(flag)) {
      contributions.push({
        source: `flag:${flag}`,
        label: FLAG_LABELS[flag],
        detail: FLAG_DETAILS[flag],
        points: FLAG_POINTS[flag],
      });
    }
  }
  return contributions;
}

/** Final Risk Score = min(100, raw) — never exceeds 100, additive with no double-counting. */
export function riskScore(contributions: readonly RiskContribution[]): number {
  const raw = contributions.reduce((sum, contribution) => sum + contribution.points, 0);
  return Math.min(RISK_SCORE_MAX, raw);
}

/** Exact tier boundaries (PRD §3.2 B): LOW 0–30, MEDIUM 31–60, HIGH 61–100. */
export function riskTier(score: number): RiskTier {
  if (score <= RISK_TIER_LOW_MAX) return 'LOW';
  if (score <= RISK_TIER_MEDIUM_MAX) return 'MEDIUM';
  return 'HIGH';
}

/**
 * Boundary-proximity display (PRD §3.2 B UI nuance): always show how far the
 * score is from the next tier boundary, so a 29/100 (LOW) reads as "2 points
 * from MEDIUM" rather than looking identical in confidence to a 5/100.
 */
export function tierProximity(score: number): TierProximity {
  if (score <= RISK_TIER_LOW_MAX) {
    const points = RISK_TIER_LOW_MAX + 1 - score;
    return { nextTier: 'MEDIUM', points, message: `${points} point${points === 1 ? '' : 's'} from MEDIUM` };
  }
  if (score <= RISK_TIER_MEDIUM_MAX) {
    const points = RISK_TIER_MEDIUM_MAX + 1 - score;
    return { nextTier: 'HIGH', points, message: `${points} point${points === 1 ? '' : 's'} from HIGH` };
  }
  const toMax = RISK_SCORE_MAX - score;
  if (toMax === 0) {
    return { nextTier: null, points: 0, message: 'At the maximum risk score (100)' };
  }
  return { nextTier: null, points: toMax, message: `${toMax} point${toMax === 1 ? '' : 's'} below the maximum (100)` };
}
