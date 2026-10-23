import { z } from 'zod';
import { isSupportedCurrency } from '@/lib/currency';
import { OFFER_FLAGS, type OfferFlag } from '@/lib/engine/types';

export const CURRENCY_MESSAGE = 'Currency must be a valid ISO 4217 code, e.g. USD, EUR, IDR.';

export const OfferFlagSchema = z.enum(OFFER_FLAGS, {
  errorMap: () => ({ message: 'Unknown risk flag.' }),
});

/**
 * The single source of truth for offer validation (PRD §3.4) — shared by the
 * API routes and the client form, so inline errors appear before submission
 * and every invalid input resolves to a structured HTTP 400, never a crash.
 * Numeric checks chain on ZodNumber (before any refine) so the messages stay
 * field-specific and deterministic.
 */
export const OfferInputSchema = z.object({
  budget: z
    .number({ invalid_type_error: 'Budget must be a number.', required_error: 'Budget is required.' })
    .positive('Budget must be greater than zero.')
    .refine((value) => Number.isFinite(value), { message: 'Budget must be a finite number.' }),

  currency: z
    .string({ invalid_type_error: CURRENCY_MESSAGE, required_error: CURRENCY_MESSAGE })
    .trim()
    .transform((value) => value.toUpperCase())
    .refine(isSupportedCurrency, { message: CURRENCY_MESSAGE }),

  platformFeePercent: z
    .number({ invalid_type_error: 'Platform fee must be a number.' })
    .min(0, 'Platform fee must be 0 or more.')
    .refine((value) => value < 100, { message: 'Platform fee must be below 100 percent.' })
    .default(0),

  estimatedHours: z
    .number({ invalid_type_error: 'Estimated hours must be a number.', required_error: 'Estimated hours is required.' })
    .positive('Estimated hours must be greater than zero.')
    .refine((value) => Number.isFinite(value), { message: 'Estimated hours must be a finite number.' }),

  depositPercent: z
    .number({ invalid_type_error: 'Deposit must be a number.' })
    .min(0, 'Deposit must be between 0 and 100 percent.')
    .max(100, 'Deposit must be between 0 and 100 percent.')
    .default(0),

  paymentTermsDays: z
    .number({ invalid_type_error: 'Payment terms must be a number.' })
    .min(0, 'Payment terms must be between 0 and 365 days.')
    .max(365, 'Payment terms must be between 0 and 365 days.')
    .default(0),

  allowedRevisions: z
    .number({ invalid_type_error: 'Allowed revisions must be a number.' })
    .int('Allowed revisions must be a whole number of 0 or more.')
    .min(0, 'Allowed revisions must be 0 or more.')
    .max(20, 'Allowed revisions must be 20 or fewer.')
    .default(0),

  targetRate: z
    .number({ invalid_type_error: 'Target hourly rate must be a number.', required_error: 'Target hourly rate is required.' })
    .positive('Target hourly rate must be greater than zero.')
    .refine((value) => Number.isFinite(value), { message: 'Target hourly rate must be a finite number.' }),

  flags: z
    .array(OfferFlagSchema, { invalid_type_error: 'Flags must be an array.' })
    .max(4, 'At most 4 risk flags.')
    // dedupe: a repeated flag must never double-count its points (PRD §3.4)
    .transform((flags) => [...new Set(flags)])
    .default([]),
});

export interface ValidationIssue {
  field: string;
  message: string;
}

/** Maps a ZodError into the uniform field-specific 400 issue list. */
export function zodToIssues(error: z.ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join('.') : 'body',
    message: issue.message,
  }));
}

/** All-nullable Smart Paste extraction shape — every key present or null (PRD §3.3). */
export interface ExtractedFields {
  budget: number | null;
  currency: string | null;
  platformFeePercent: number | null;
  estimatedHours: number | null;
  depositPercent: number | null;
  paymentTermsDays: number | null;
  allowedRevisions: number | null;
  flags: OfferFlag[] | null;
}

export const EMPTY_EXTRACTED_FIELDS: ExtractedFields = {
  budget: null,
  currency: null,
  platformFeePercent: null,
  estimatedHours: null,
  depositPercent: null,
  paymentTermsDays: null,
  allowedRevisions: null,
  flags: null,
};

/** Offer ids are nanoid(12) or preset names — URL-safe alphabet. */
export const OFFER_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
