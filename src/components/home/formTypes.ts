import type { z } from 'zod';
import type { OfferFlag, OfferInput } from '@/lib/engine/types';
import { OfferInputSchema } from '@/lib/validation/offer';

export type NumericFormKey =
  | 'budget'
  | 'platformFeePercent'
  | 'estimatedHours'
  | 'depositPercent'
  | 'paymentTermsDays'
  | 'allowedRevisions'
  | 'targetRate';

export type FormFieldKey = NumericFormKey | 'currency';

export interface FormState {
  budget: string;
  currency: string;
  platformFeePercent: string;
  estimatedHours: string;
  depositPercent: string;
  paymentTermsDays: string;
  allowedRevisions: string;
  targetRate: string;
  flags: OfferFlag[];
}

export const FORM_FIELD_KEYS: readonly FormFieldKey[] = [
  'budget',
  'currency',
  'platformFeePercent',
  'estimatedHours',
  'depositPercent',
  'paymentTermsDays',
  'allowedRevisions',
  'targetRate',
];

export const FIELD_LABELS: Record<FormFieldKey, string> = {
  budget: 'Project budget',
  currency: 'Currency',
  platformFeePercent: 'Platform fee',
  estimatedHours: 'Estimated hours',
  depositPercent: 'Upfront deposit',
  paymentTermsDays: 'Payment terms',
  allowedRevisions: 'Allowed revisions',
  targetRate: 'Target hourly rate',
};

export const REQUIRED_NUMERIC: readonly NumericFormKey[] = ['budget', 'estimatedHours', 'targetRate'];

/** Field-level checkers — the same Zod schema the API uses, so inline errors
 * before submission are identical to the server's HTTP 400 issues. */
export const CHECKERS: Record<NumericFormKey, z.ZodTypeAny> = {
  budget: OfferInputSchema.shape.budget,
  platformFeePercent: OfferInputSchema.shape.platformFeePercent,
  estimatedHours: OfferInputSchema.shape.estimatedHours,
  depositPercent: OfferInputSchema.shape.depositPercent,
  paymentTermsDays: OfferInputSchema.shape.paymentTermsDays,
  allowedRevisions: OfferInputSchema.shape.allowedRevisions,
  targetRate: OfferInputSchema.shape.targetRate,
};

export const EMPTY_FORM: FormState = {
  budget: '',
  currency: 'USD',
  platformFeePercent: '',
  estimatedHours: '',
  depositPercent: '',
  paymentTermsDays: '',
  allowedRevisions: '',
  targetRate: '',
  flags: [],
};

/** Parses a form string into a finite number, or null when empty/invalid. */
export function parseNumberInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const sanitized = trimmed.replace(/[%$€£,]/g, '').trim();
  if (sanitized === '') return null;
  const value = Number(sanitized);
  return Number.isFinite(value) ? value : null;
}

export function inputToForm(input: OfferInput): FormState {
  return {
    budget: String(input.budget),
    currency: input.currency,
    platformFeePercent: String(input.platformFeePercent),
    estimatedHours: String(input.estimatedHours),
    depositPercent: String(input.depositPercent),
    paymentTermsDays: String(input.paymentTermsDays),
    allowedRevisions: String(input.allowedRevisions),
    targetRate: String(input.targetRate),
    flags: [...input.flags],
  };
}

export function buildPayloadFromForm(form: FormState): OfferInput {
  return {
    budget: parseNumberInput(form.budget) ?? 0,
    currency: form.currency,
    platformFeePercent: parseNumberInput(form.platformFeePercent) ?? 0,
    estimatedHours: parseNumberInput(form.estimatedHours) ?? 0,
    depositPercent: parseNumberInput(form.depositPercent) ?? 0,
    paymentTermsDays: parseNumberInput(form.paymentTermsDays) ?? 0,
    allowedRevisions: parseNumberInput(form.allowedRevisions) ?? 0,
    targetRate: parseNumberInput(form.targetRate) ?? 0,
    flags: form.flags,
  };
}
