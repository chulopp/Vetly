import {
  adjustedHours,
  effectiveHourlyRate,
  netBudget,
  profitabilityMargin,
  revisionPenaltyHours,
  round2,
} from './rate';
import {
  buildCounterOffer,
  decisionReason,
  marginBand,
  marginProximity,
  recommendAction,
} from './decision';
import { riskContributions, riskScore, riskTier, tierProximity } from './risk';
import type { AnalysisResult, OfferInput } from './types';

/**
 * The single entry point of the deterministic engine (PRD §3.2).
 * Pure function: same input, same output, everywhere — server, client, or test.
 */
export function analyzeOffer(input: OfferInput): AnalysisResult {
  const penalty = revisionPenaltyHours(input.allowedRevisions, input.flags);
  const net = netBudget(input.budget, input.platformFeePercent);
  const adjusted = adjustedHours(input.estimatedHours, penalty);
  const effectiveRate = effectiveHourlyRate(net, adjusted);
  const margin = profitabilityMargin(effectiveRate, input.targetRate);
  const band = marginBand(margin);

  const contributions = riskContributions(input);
  const score = riskScore(contributions);
  const tier = riskTier(score);
  const action = recommendAction(band, tier);

  return {
    input,
    netBudget: round2(net),
    adjustedHours: round2(adjusted),
    revisionPenalty: penalty,
    effectiveHourlyRate: effectiveRate,
    profitabilityMargin: margin,
    marginBand: band,
    marginProximity: marginProximity(margin),
    riskScore: score,
    riskTier: tier,
    riskProximity: tierProximity(score),
    riskContributions: contributions,
    recommendAction: action,
    decisionReason: decisionReason(band, tier, margin),
    counterOffer: buildCounterOffer(input, { band, tier, action }),
  };
}

export * from './constants';
export * from './format';
export * from './rate';
export * from './risk';
export * from './decision';
export * from './types';
