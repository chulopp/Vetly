import { isSupportedCurrency } from '@/lib/currency';
import { OFFER_FLAGS, type OfferFlag } from '@/lib/engine/types';
import { EMPTY_EXTRACTED_FIELDS, type ExtractedFields } from '@/lib/validation/offer';
import { chatJson } from './deepseek';

const SYSTEM_PROMPT = `You extract structured freelance project offer data from a raw client message, which may be written in ANY language.

Return ONLY a JSON object with EXACTLY these keys — every value is a number, a string, an array of strings, or null. Use null whenever the message does not clearly state the value. Never guess, never invent numbers:

{
  "budget": number | null,         // total project budget/quote as a plain number, no symbols or separators
  "currency": string | null,       // ISO 4217 alpha-3 code (e.g. "USD", "EUR", "IDR") if stated or clearly implied, else null
  "estimatedHours": number | null, // estimated hours of work if mentioned, else null
  "platformFeePercent": number | null, // platform/payment fee percent if a platform fee is mentioned (e.g. Upwork 10%, Fiverr 20%), else null
  "depositPercent": number | null, // upfront deposit percent if mentioned, else null
  "paymentTermsDays": number | null, // payment term in days (e.g. "net 30" is 30, "net-90" is 90) if mentioned, else null
  "allowedRevisions": number | null, // number of allowed revision rounds if mentioned, else null
  "flags": string[] | null // subset of ["no_contract","vague_scope","unlimited_revisions","first_time_client"], or null if none apply
}

Rules:
- The output labels are English regardless of the input language.
- "unlimited revisions", "as many changes as needed", or similar -> include "unlimited_revisions" in flags and leave allowedRevisions null.
- A new/unknown client ("first time working together") -> include "first_time_client".
- Vague or undefined scope ("a simple app", "something like...") -> include "vague_scope".
- Only include "no_contract" if the message implies no formal agreement will be signed.
- Percentages are plain numbers: "50%" is 50, "half upfront" is 50 for depositPercent.
- Amounts with currency symbols or units still belong in "budget" as a plain number, with the currency in "currency".`;

export interface ExtractOutcome {
  ok: boolean;
  fields: ExtractedFields;
  error: 'llm_unavailable' | 'llm_invalid_response' | null;
}

/**
 * Smart Paste extraction (PRD §3.3). Isolated from the deterministic engine:
 * this module imports nothing from engine/ (only types) and never writes to
 * storage — the extracted fields only pre-fill the form for user review.
 * Failure, timeout, or malformed/partial output always degrades gracefully.
 */
export async function extractOfferFields(text: string): Promise<ExtractOutcome> {
  const raw = await chatJson([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: text.slice(0, 20_000) },
  ]);

  if (raw === null) {
    return { ok: false, fields: EMPTY_EXTRACTED_FIELDS, error: 'llm_unavailable' };
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, fields: EMPTY_EXTRACTED_FIELDS, error: 'llm_invalid_response' };
  }
  return { ok: true, fields: sanitizeExtracted(raw as Record<string, unknown>), error: null };
}

/**
 * Defense in depth: even a malformed or hallucinated LLM response can never
 * inject arbitrary values into the form — only whitelisted keys survive, and
 * every value must individually satisfy the PRD §3.4 bounds or it becomes null.
 */
function sanitizeExtracted(obj: Record<string, unknown>): ExtractedFields {
  return {
    budget: boundedNumber(obj.budget, (v) => v > 0),
    currency: normalizeCurrency(obj.currency),
    platformFeePercent: boundedNumber(obj.platformFeePercent, (v) => v >= 0 && v < 100),
    estimatedHours: boundedNumber(obj.estimatedHours, (v) => v > 0),
    depositPercent: boundedNumber(obj.depositPercent, (v) => v >= 0 && v <= 100),
    paymentTermsDays: boundedNumber(obj.paymentTermsDays, (v) => v >= 0 && v <= 365),
    allowedRevisions: boundedNumber(obj.allowedRevisions, (v) => Number.isInteger(v) && v >= 0),
    flags: normalizeFlags(obj.flags),
  };
}

function boundedNumber(value: unknown, predicate: (v: number) => boolean): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return predicate(value) ? value : null;
}

function normalizeCurrency(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const code = value.trim().toUpperCase();
  return isSupportedCurrency(code) ? code : null;
}

function normalizeFlags(value: unknown): OfferFlag[] | null {
  if (!Array.isArray(value)) return null;
  const known = value.filter(
    (flag): flag is OfferFlag => typeof flag === 'string' && (OFFER_FLAGS as readonly string[]).includes(flag),
  );
  return [...new Set(known)];
}
