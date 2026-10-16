import type { OfferFlag } from './types';

/**
 * Business constants (PRD §3.2).
 *
 * These are heuristic business assumptions, not empirically derived figures —
 * they are documented as such in the README (PRD §3.6). They are deliberately
 * plain numbers so the deterministic engine and its tests can assert exact
 * behavior at every boundary.
 */

/** Communication/admin overhead: fixed +10% of estimated hours (meetings, setup, deployment). */
export const OVERHEAD_RATE = 0.1;

/** 0–2 revisions cost no additional hours (reasonable industry baseline). */
export const REVISION_FREE_BASE = 2;

/** >2 revisions: +5% additional hours per revision beyond 2. */
export const REVISION_PENALTY_PER_REVISION = 0.05;

/** unlimited_revisions red flag active: penalty locked at a flat +35% (scope-creep buffer), overriding the per-revision formula. */
export const UNLIMITED_REVISION_PENALTY = 0.35;

/** Risk score guard: never exceeds 100. */
export const RISK_SCORE_MAX = 100;

/** Risk tiers (exact, inclusive boundaries): LOW 0–30, MEDIUM 31–60, HIGH 61–100. */
export const RISK_TIER_LOW_MAX = 30;
export const RISK_TIER_MEDIUM_MAX = 60;

/** Margin band boundary: margin >= +20% counts as high surplus. */
export const MARGIN_SURPLUS_THRESHOLD = 20;

export const DEPOSIT_POINTS = {
  atLeast50: 0, // >= 50
  from25To50: 10, // >= 25 && < 50
  under25: 20, // > 0 && < 25
  zero: 30, // == 0
} as const;

export const PAYMENT_TERMS_POINTS = {
  within7Days: 0, // 0–7 days
  from8To30Days: 10, // 8–30 days
  from31To60Days: 20, // 31–60 days
  over60Days: 35, // > 60 days
} as const;

export const FLAG_POINTS = {
  no_contract: 25,
  vague_scope: 20,
  unlimited_revisions: 15,
  first_time_client: 10,
} as const;

export const FLAG_LABELS: Record<OfferFlag, string> = {
  no_contract: 'No contract',
  vague_scope: 'Vague scope',
  unlimited_revisions: 'Unlimited revisions',
  first_time_client: 'First-time client',
};

export const FLAG_DETAILS: Record<OfferFlag, string> = {
  no_contract: 'No signed agreement in place',
  vague_scope: 'Scope not clearly defined',
  unlimited_revisions: 'Revisions not capped',
  first_time_client: 'No track record with this client yet',
};
