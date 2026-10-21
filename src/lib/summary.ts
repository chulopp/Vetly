import { formatMoney } from '@/lib/currency';
import { formatMargin } from '@/lib/engine';
import type { OfferInput, AnalysisResult, RiskContribution } from '@/lib/engine/types';

function formatRiskDriver(c: RiskContribution, input: OfferInput): string {
  if (c.source === 'deposit') {
    if (input.depositPercent === 0) return 'no upfront deposit';
    if (input.depositPercent < 25) return 'low upfront deposit';
    return 'partial upfront deposit';
  }
  if (c.source === 'paymentTerms') {
    if (input.paymentTermsDays > 60) return 'slow payment terms (net 60+ days)';
    if (input.paymentTermsDays > 30) return 'slow payment terms (net 30+ days)';
    if (input.paymentTermsDays > 7) return 'delayed payment terms';
    return 'payment terms';
  }
  if (c.source === 'flag:no_contract') return 'no signed contract';
  if (c.source === 'flag:vague_scope') return 'vague project scope';
  if (c.source === 'flag:unlimited_revisions') return 'unlimited revisions';
  if (c.source === 'flag:first_time_client') return 'no history with this client';
  return c.label.toLowerCase();
}

function getTopRiskDrivers(contributions: RiskContribution[], input: OfferInput, limit = 2): string[] {
  // Sort by points descending, ignore 0-point factors
  const active = contributions
    .filter((c) => c.points > 0)
    .sort((a, b) => b.points - a.points);

  const drivers = active.slice(0, limit).map((c) => formatRiskDriver(c, input));
  return Array.from(new Set(drivers));
}

function joinList(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

export interface SummaryData {
  input: OfferInput;
  analysis: AnalysisResult;
}

/**
 * Generates a single plain-English synthesis sentence for the verdict card.
 * Answers "why is this deal good or bad?" immediately without requiring the
 * user to connect 3 separate numbers and scroll through cards.
 * Never includes em-dashes (—).
 */
export function generateVerdictSummary({ input, analysis }: SummaryData): string {
  const diff = Math.abs(analysis.effectiveHourlyRate - input.targetRate);
  const diffFormatted = formatMoney(diff, input.currency);
  const marginFormatted = formatMargin(analysis.profitabilityMargin);
  const isSurplus = analysis.effectiveHourlyRate >= input.targetRate;
  const topDrivers = getTopRiskDrivers(analysis.riskContributions, input, 2);
  const driversText = joinList(topDrivers);

  if (analysis.recommendAction === 'ACCEPT') {
    if (isSurplus && diff > 0) {
      return `This deal pays ${diffFormatted} more per hour than your target (+${marginFormatted}% surplus) with low client risk, safe and ready to accept.`;
    }
    return `This deal meets your target rate with low client risk, safe and ready to accept.`;
  }

  if (analysis.recommendAction === 'REJECT') {
    if (!isSurplus) {
      if (driversText) {
        return `This deal pays ${diffFormatted} less per hour than you need (${marginFormatted}% deficit) with ${analysis.riskTier} client risk, mostly from ${driversText}.`;
      }
      return `This deal pays ${diffFormatted} less per hour than you need (${marginFormatted}% deficit) with ${analysis.riskTier} client risk, not recommended as offered.`;
    }
    // Surplus budget but REJECT due to high risk
    if (driversText) {
      return `The budget clears your target by ${diffFormatted} per hour (+${marginFormatted}%), but client risk is HIGH due to ${driversText}, reject as-is unless terms are fixed.`;
    }
    return `The budget clears your target by ${diffFormatted} per hour (+${marginFormatted}%), but client risk is HIGH, reject as-is unless terms are fixed.`;
  }

  // NEGOTIATE
  if (!isSurplus) {
    if (driversText) {
      return `This deal pays ${diffFormatted} less per hour than you need (${marginFormatted}% deficit), mostly from ${driversText}.`;
    }
    return `This deal pays ${diffFormatted} less per hour than your target rate (${marginFormatted}% deficit), counter with a higher budget or commit to fewer hours.`;
  }

  // Rate clears target, but NEGOTIATE due to medium/high risk terms
  if (driversText) {
    return `The rate clears your target by ${diffFormatted} per hour (+${marginFormatted}% surplus), but client risk is ${analysis.riskTier} due to ${driversText}.`;
  }
  return `The rate clears your target by ${diffFormatted} per hour (+${marginFormatted}% surplus), but client risk is ${analysis.riskTier}, negotiate terms before accepting.`;
}
