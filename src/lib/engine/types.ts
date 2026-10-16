export const OFFER_FLAGS = [
  'no_contract',
  'vague_scope',
  'unlimited_revisions',
  'first_time_client',
] as const;

export type OfferFlag = (typeof OFFER_FLAGS)[number];

export interface OfferInput {
  /** Total project budget / quote, in the offer's currency. */
  budget: number;
  /** ISO 4217 alpha-3 code, validated against the bundled list. */
  currency: string;
  /** Platform / payment fee percent, 0–<100 (default 0). */
  platformFeePercent: number;
  /** Estimated hours of work, > 0. */
  estimatedHours: number;
  /** Upfront deposit percent, 0–100. */
  depositPercent: number;
  /** Payment terms in days, 0–365. */
  paymentTermsDays: number;
  /** Allowed revision rounds, integer >= 0. */
  allowedRevisions: number;
  /** The freelancer's own minimum hourly rate, in the same currency as budget. */
  targetRate: number;
  /** Active client red flags. */
  flags: OfferFlag[];
}

export type RiskTier = 'LOW' | 'MEDIUM' | 'HIGH';

export type RecommendAction = 'ACCEPT' | 'NEGOTIATE' | 'REJECT';

export type MarginBand = 'HIGH_SURPLUS' | 'FAIR' | 'DEFICIT';

export type RiskContributionSource = 'deposit' | 'paymentTerms' | `flag:${OfferFlag}`;

export interface RiskContribution {
  source: RiskContributionSource;
  label: string;
  detail: string;
  points: number;
}

export interface TierProximity {
  nextTier: RiskTier | null;
  points: number | null;
  message: string;
}

export interface MarginProximity {
  threshold: '+20% surplus' | 'break-even' | null;
  direction: 'above' | 'below';
  points: number;
  message: string;
}

export interface CounterOffer {
  /** True when the margin called for budget-side numbers. */
  budgetTriggered: boolean;
  /** Minimum budget that makes the effective rate exactly hit the target (present iff budgetTriggered). */
  suggestedBudget: number | null;
  /** Most raw hours to spend at the current budget and still hit the target (present iff budgetTriggered). */
  maxExecutableHours: number | null;
  /** True when the risk tier called for contract conditions. */
  riskTriggered: boolean;
  /** Exact PRD condition strings, in PRD order (present iff riskTriggered). */
  contractConditions: string[];
}

export interface AnalysisResult {
  input: OfferInput;
  netBudget: number;
  adjustedHours: number;
  revisionPenalty: number;
  effectiveHourlyRate: number;
  profitabilityMargin: number;
  marginBand: MarginBand;
  marginProximity: MarginProximity;
  riskScore: number;
  riskTier: RiskTier;
  riskProximity: TierProximity;
  riskContributions: RiskContribution[];
  recommendAction: RecommendAction;
  decisionReason: string;
  counterOffer: CounterOffer | null;
}
