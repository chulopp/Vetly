'use client';

import { ChevronDown } from 'lucide-react';
import { CURRENCIES } from '@/lib/currency';
import type { OfferFlag } from '@/lib/engine/types';
import { cn } from '@/lib/utils';
import type { FormFieldKey, FormState } from './formTypes';

interface OfferFormProps {
  form: FormState;
  errors: Partial<Record<FormFieldKey, string>>;
  onFieldChange: (key: FormFieldKey, value: string) => void;
  onFieldBlur: (key: FormFieldKey) => void;
  onFlagToggle: (flag: OfferFlag) => void;
}

function inputClass(hasError: boolean): string {
  return cn(
    'w-full rounded-xl border bg-white/[0.04] px-3.5 py-2.5 text-sm text-ink-100 outline-none transition placeholder:text-ink-500 tnum focus:ring-2 focus:ring-white/10',
    hasError ? 'border-reject/60 focus:border-reject/60' : 'border-white/10 focus:border-white/30',
  );
}

const NUMERIC_FIELDS: Array<{ key: FormFieldKey; label: string; placeholder: string; hint: string }> = [
  { key: 'budget', label: 'Project budget / quote', placeholder: 'e.g. 8000', hint: 'The total the client offered, in the selected currency.' },
  { key: 'estimatedHours', label: 'Estimated hours', placeholder: 'e.g. 120', hint: 'Your realistic estimate of the work.' },
  { key: 'platformFeePercent', label: 'Platform fee %', placeholder: '0', hint: '0 direct · 3 Wise/Stripe · 10 Upwork · 20 Fiverr · empty = 0.' },
  { key: 'depositPercent', label: 'Upfront deposit %', placeholder: 'e.g. 50', hint: '0–100 · empty = 0 (no deposit).' },
  { key: 'paymentTermsDays', label: 'Payment terms (days)', placeholder: 'e.g. 7, 30, 90', hint: 'Days until you get paid · empty = 0 (due upfront).' },
  { key: 'allowedRevisions', label: 'Allowed revisions', placeholder: 'e.g. 2', hint: 'Whole rounds · 0–2 cost no extra hours.' },
  { key: 'targetRate', label: 'Your target hourly rate', placeholder: 'e.g. 50', hint: 'What you need to earn per hour.' },
];

const FLAG_OPTIONS: Array<{ flag: OfferFlag; label: string; hint: string }> = [
  { flag: 'no_contract', label: 'No contract', hint: 'No signed agreement in place' },
  { flag: 'vague_scope', label: 'Vague scope', hint: 'Scope not clearly defined' },
  { flag: 'unlimited_revisions', label: 'Unlimited revisions', hint: 'Revisions not capped' },
  { flag: 'first_time_client', label: 'First-time client', hint: 'No track record with this client yet' },
];

export default function OfferForm({ form, errors, onFieldChange, onFieldBlur, onFlagToggle }: OfferFormProps) {
  return (
    <>
      {NUMERIC_FIELDS.slice(0, 1).map((field) => (
        <NumericField
          key={field.key}
          field={field}
          value={form}
          error={errors[field.key]}
          onChange={onFieldChange}
          onBlur={onFieldBlur}
        />
      ))}

      {/* currency */}
      <div>
        <label htmlFor="field-currency" className="text-xs font-medium text-ink-300">
          Currency
        </label>
        <div className="relative mt-1.5">
          <select
            id="field-currency"
            value={form.currency}
            onChange={(event) => onFieldChange('currency', event.target.value)}
            className={cn(inputClass(false), 'appearance-none pr-9')}
          >
            {CURRENCIES.map((currency) => (
              <option key={currency.code} value={currency.code} className="bg-base-900 text-ink-100">
                {currency.code} — {currency.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-500" />
        </div>
        <p className="mt-1.5 text-[11px] leading-snug text-ink-500">
          The offer&apos;s native currency — budget, target rate, and results all stay in it.
        </p>
      </div>

      {NUMERIC_FIELDS.slice(1).map((field) => (
        <NumericField
          key={field.key}
          field={field}
          value={form}
          error={errors[field.key]}
          onChange={onFieldChange}
          onBlur={onFieldBlur}
        />
      ))}

      {/* red flags */}
      <div className="sm:col-span-2">
        <span className="text-xs font-medium text-ink-300">Client red flags</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {FLAG_OPTIONS.map((option) => {
            const active = form.flags.includes(option.flag);
            return (
              <button
                key={option.flag}
                type="button"
                aria-pressed={active}
                title={option.hint}
                onClick={() => onFlagToggle(option.flag)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-sm transition-all active:scale-[0.97]',
                  active
                    ? 'border-reject/50 bg-reject/15 text-reject'
                    : 'border-white/15 bg-white/[0.03] text-ink-300 hover:border-white/30 hover:text-ink-100',
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-[11px] leading-snug text-ink-500">
          Toggle any that apply — the live risk score updates as you go.
        </p>
      </div>
    </>
  );
}

function NumericField({
  field,
  value,
  error,
  onChange,
  onBlur,
}: {
  field: { key: FormFieldKey; label: string; placeholder: string; hint: string };
  value: FormState;
  error?: string;
  onChange: (key: FormFieldKey, value: string) => void;
  onBlur: (key: FormFieldKey) => void;
}) {
  return (
    <div>
      <label htmlFor={`field-${field.key}`} className="text-xs font-medium text-ink-300">
        {field.label}
      </label>
      <input
        id={`field-${field.key}`}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value[field.key as keyof FormState] as string}
        placeholder={field.placeholder}
        onChange={(event) => onChange(field.key, event.target.value)}
        onBlur={() => onBlur(field.key)}
        className={cn('mt-1.5', inputClass(Boolean(error)))}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-reject">{error}</p>
      ) : (
        <p className="mt-1.5 text-[11px] leading-snug text-ink-500">{field.hint}</p>
      )}
    </div>
  );
}
