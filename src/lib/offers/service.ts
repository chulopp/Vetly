import { desc, eq, inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getDb } from '@/lib/db/client';
import { offers } from '@/lib/db/schema';
import type { AnalysisResult, OfferInput } from '@/lib/engine/types';

export interface OfferRecord {
  id: string;
  input: OfferInput;
  analysis: AnalysisResult;
  createdAt: string;
}

const ID_LENGTH = 12;

export function newOfferId(): string {
  return nanoid(ID_LENGTH);
}

export async function createOffer(input: OfferInput, analysis: AnalysisResult): Promise<string> {
  const db = getDb();
  const id = newOfferId();
  await db.insert(offers).values({
    id,
    // exact decimal strings — NUMERIC stores them without float conversion
    budget: String(input.budget),
    currency: input.currency,
    platformFeePercent: String(input.platformFeePercent),
    estimatedHours: String(input.estimatedHours),
    depositPercent: String(input.depositPercent),
    paymentTermsDays: String(input.paymentTermsDays),
    allowedRevisions: input.allowedRevisions,
    targetRate: String(input.targetRate),
    flags: input.flags,
    effectiveHourlyRate: String(analysis.effectiveHourlyRate),
    profitabilityMargin: String(analysis.profitabilityMargin),
    riskScore: analysis.riskScore,
    riskTier: analysis.riskTier,
    recommendAction: analysis.recommendAction,
    analysis,
  });
  return id;
}

type OfferRow = typeof offers.$inferSelect;

function toRecord(row: OfferRow): OfferRecord {
  return {
    id: row.id,
    input: {
      budget: Number(row.budget),
      currency: row.currency,
      platformFeePercent: Number(row.platformFeePercent),
      estimatedHours: Number(row.estimatedHours),
      depositPercent: Number(row.depositPercent),
      paymentTermsDays: Number(row.paymentTermsDays),
      allowedRevisions: row.allowedRevisions,
      targetRate: Number(row.targetRate),
      flags: row.flags ?? [],
    },
    analysis: row.analysis,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getOffer(id: string): Promise<OfferRecord | null> {
  const db = getDb();
  const rows = await db.select().from(offers).where(eq(offers.id, id)).limit(1);
  return rows.length > 0 ? toRecord(rows[0]) : null;
}

export async function listOffers(ids: string[]): Promise<OfferRecord[]> {
  if (ids.length === 0) return [];
  const db = getDb();
  const rows = await db.select().from(offers).where(inArray(offers.id, ids)).orderBy(desc(offers.createdAt));
  return rows.map(toRecord);
}
