import { desc, eq, inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getDb } from '@/lib/db/client';
import { offers } from '@/lib/db/schema';
import { analyzeOffer } from '@/lib/engine';
import { findPreset } from '@/lib/presets';
import type { AnalysisResult, OfferInput } from '@/lib/engine/types';

export interface OfferRecord {
  id: string;
  input: OfferInput;
  analysis: AnalysisResult;
  draftMessage?: string | null;
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
    draftMessage: row.draftMessage ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function saveDraftMessage(id: string, message: string): Promise<void> {
  const db = getDb();
  await db.update(offers).set({ draftMessage: message }).where(eq(offers.id, id));
}

export async function getOffer(id: string): Promise<OfferRecord | null> {
  try {
    const db = getDb();
    const rows = await db.select().from(offers).where(eq(offers.id, id)).limit(1);
    if (rows.length > 0) return toRecord(rows[0]);
  } catch (error) {
    const preset = findPreset(id);
    if (preset) {
      return {
        id: preset.id,
        input: preset.input,
        analysis: analyzeOffer(preset.input),
        createdAt: new Date().toISOString(),
      };
    }
    throw error;
  }

  // If not in database, check if id is a preset or preset alias
  const preset = findPreset(id);
  if (preset) {
    return {
      id: preset.id,
      input: preset.input,
      analysis: analyzeOffer(preset.input),
      createdAt: new Date().toISOString(),
    };
  }
  return null;
}

export async function listOffers(ids: string[]): Promise<OfferRecord[]> {
  if (ids.length === 0) return [];
  const records: OfferRecord[] = [];

  try {
    const db = getDb();
    const rows = await db.select().from(offers).where(inArray(offers.id, ids)).orderBy(desc(offers.createdAt));
    records.push(...rows.map(toRecord));
  } catch (error) {
    const foundIds = new Set<string>();
    for (const requestedId of ids) {
      if (!foundIds.has(requestedId)) {
        const preset = findPreset(requestedId);
        if (preset && !foundIds.has(preset.id)) {
          foundIds.add(preset.id);
          records.push({
            id: preset.id,
            input: preset.input,
            analysis: analyzeOffer(preset.input),
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
    if (records.length > 0) return records;
    throw error;
  }

  // Also include any preset IDs in the requested list that aren't in the database
  const foundIds = new Set(records.map((r) => r.id));
  for (const requestedId of ids) {
    if (!foundIds.has(requestedId)) {
      const preset = findPreset(requestedId);
      if (preset && !foundIds.has(preset.id)) {
        foundIds.add(preset.id);
        records.push({
          id: preset.id,
          input: preset.input,
          analysis: analyzeOffer(preset.input),
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  return records;
}
