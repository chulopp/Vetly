import { index, integer, jsonb, numeric, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import type { AnalysisResult, OfferFlag } from '@/lib/engine/types';

/**
 * Single MVP table (PRD §4.2): all raw input fields (echoed for share links,
 * Smart Paste review, and Duplicate & edit), the computed outputs the Compare
 * table sorts on, and the full deterministic analysis snapshot.
 *
 * Numeric columns are unconstrained NUMERIC — exact money math in Postgres and
 * no overflow at any legal input magnitude. Values are inserted as exact
 * decimal strings and converted back at the serialization boundary.
 */
export const offers = pgTable(
  'offers',
  {
    id: varchar('id', { length: 16 }).primaryKey(), // nanoid(12), URL-safe

    // ---- raw inputs ----
    budget: numeric('budget').notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    platformFeePercent: numeric('platform_fee_percent').notNull(),
    estimatedHours: numeric('estimated_hours').notNull(),
    depositPercent: numeric('deposit_percent').notNull(),
    paymentTermsDays: numeric('payment_terms_days').notNull(),
    allowedRevisions: integer('allowed_revisions').notNull(),
    targetRate: numeric('target_rate').notNull(),
    flags: jsonb('flags').$type<OfferFlag[]>().notNull().default([]),

    // ---- computed outputs (engine snapshot) ----
    effectiveHourlyRate: numeric('effective_hourly_rate').notNull(),
    profitabilityMargin: numeric('profitability_margin').notNull(),
    riskScore: integer('risk_score').notNull(),
    riskTier: varchar('risk_tier', { length: 8 }).notNull(), // LOW | MEDIUM | HIGH
    recommendAction: varchar('recommend_action', { length: 10 }).notNull(), // ACCEPT | NEGOTIATE | REJECT
    analysis: jsonb('analysis').$type<AnalysisResult>().notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('offers_created_at_idx').on(table.createdAt)],
);
