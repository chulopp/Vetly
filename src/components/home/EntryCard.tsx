'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CaretDown } from '@phosphor-icons/react';
import LiveRiskGauge from '@/components/home/LiveRiskGauge';
import OfferForm from '@/components/home/OfferForm';
import PresetChips from '@/components/home/PresetChips';
import SmartPasteBox, { type PasteStatus } from '@/components/home/SmartPasteBox';
import { Spinner } from '@/components/ui/Spinner';
import {
  riskContributions,
  riskScore,
  riskTier,
  tierProximity,
} from '@/lib/engine';
import type { OfferFlag, OfferInput } from '@/lib/engine/types';
import { addMyOffer } from '@/lib/myOffers';
import { OfferInputSchema, zodToIssues, type ExtractedFields, type ValidationIssue } from '@/lib/validation/offer';
import { cn } from '@/lib/utils';
import {
  CHECKERS,
  EMPTY_FORM,
  FIELD_LABELS,
  FORM_FIELD_KEYS,
  REQUIRED_NUMERIC,
  buildPayloadFromForm,
  inputToForm,
  parseNumberInput,
  type FormFieldKey,
  type FormState,
} from './formTypes';

interface EntryCardProps {
  expanded?: boolean;
  onExpand?: () => void;
}

/**
 * The entry card (PRD §4.3 Home): Smart Paste as the primary element at the
 * top, preset chips below it, the manual form behind a collapsed accordion,
 * and the live risk gauge as a second column (desktop) / above the submit
 * button (mobile) once a risk-relevant field is touched.
 */
export default function EntryCard({ expanded, onExpand }: EntryCardProps = {}) {
  const router = useRouter();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [presetRevision, setPresetRevision] = useState(0);
  const [touched, setTouched] = useState<Partial<Record<FormFieldKey, boolean>>>({});
  const [serverFieldErrors, setServerFieldErrors] = useState<Partial<Record<FormFieldKey, string>>>({});
  const [formOpen, setFormOpen] = useState(false);
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [paste, setPaste] = useState<{ status: PasteStatus; message: string | null }>({
    status: 'idle',
    message: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isExpanded = expanded ?? internalExpanded;

  // ── Duplicate & edit: /?prefill=<id> populates the form (PRD §4.2 Step 4) ──
  // ── Intake parameter: /?intake=open expands the form (from compare empty-state CTA) ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('intake') === 'open') {
      setFormOpen(true);
      setInternalExpanded(true);
      if (onExpand) onExpand();
    }
    const prefillId = params.get('prefill');
    if (!prefillId) return;
    let cancelled = false;
    fetch(`/api/offers/${encodeURIComponent(prefillId)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled || !data?.offer?.input) return;
        setForm(inputToForm(data.offer.input as OfferInput));
        setFormOpen(true);
        setInternalExpanded(true);
        if (onExpand) onExpand();
      })
      .catch(() => {
        // a broken prefill just leaves the empty form — never blocks the flow
      });
    return () => {
      cancelled = true;
    };
  }, [onExpand]);

  // ── Field-level validation (same Zod schema the API uses) ──

  const errorFor = (key: FormFieldKey, isTouched: boolean): string | null => {
    if (key === 'currency') return null; // always chosen from the bundled list
    const serverError = serverFieldErrors[key];
    if (serverError) return serverError;
    const raw = form[key];
    if (raw.trim() === '') {
      return isTouched && REQUIRED_NUMERIC.includes(key) ? `${FIELD_LABELS[key]} is required.` : null;
    }
    const value = parseNumberInput(raw);
    if (value === null) return `${FIELD_LABELS[key]} must be a number.`;
    const check = CHECKERS[key].safeParse(value);
    if (!check.success) return zodToIssues(check.error)[0]?.message ?? 'Invalid value.';
    return null;
  };

  const errors = useMemo(() => {
    const map: Partial<Record<FormFieldKey, string>> = {};
    for (const key of FORM_FIELD_KEYS) {
      const error = errorFor(key, Boolean(touched[key]));
      if (error) map[key] = error;
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, touched, serverFieldErrors]);

  // ── Live risk gauge (same pure scoring functions, run client-side) ──

  const gaugeVisible =
    form.depositPercent.trim() !== '' || form.paymentTermsDays.trim() !== '' || form.flags.length > 0;

  const riskView = useMemo(() => {
    if (!gaugeVisible) return null;
    const deposit = parseNumberInput(form.depositPercent);
    const terms = parseNumberInput(form.paymentTermsDays);
    const contributions = riskContributions({
      depositPercent: deposit ?? 0,
      paymentTermsDays: terms ?? 0,
      flags: form.flags,
    });
    const score = riskScore(contributions);
    return {
      score,
      tier: riskTier(score),
      proximity: tierProximity(score),
      contributions,
      assumingDefaults: deposit === null || terms === null,
    };
  }, [gaugeVisible, form.depositPercent, form.paymentTermsDays, form.flags]);

  // ── Handlers ──

  function handleFieldChange(key: FormFieldKey, value: string) {
    setActivePresetId(null);
    setForm((prev) => ({ ...prev, [key]: value }));
    setServerFieldErrors({});
    setSubmitError(null);
    if (key !== 'currency' && value.trim() !== '') {
      const parsed = parseNumberInput(value);
      const invalid = parsed === null || !CHECKERS[key].safeParse(parsed).success;
      if (invalid) setTouched((prev) => ({ ...prev, [key]: true })); // show inline error immediately
    }
  }

  function handleFieldBlur(key: FormFieldKey) {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }

  function handleFlagToggle(flag: OfferFlag) {
    setActivePresetId(null);
    setForm((prev) => ({
      ...prev,
      flags: prev.flags.includes(flag) ? prev.flags.filter((f) => f !== flag) : [...prev.flags, flag],
    }));
  }

  function applyPreset(input: OfferInput, presetId?: string) {
    setActivePresetId(presetId ?? null);
    setPresetRevision((r) => r + 1);
    setForm(inputToForm(input));
    setTouched({});
    setServerFieldErrors({});
    setSubmitError(null);
    setFormOpen(true);
    setInternalExpanded(true);
    if (onExpand) onExpand();
  }

  function applyExtracted(fields: ExtractedFields) {
    setForm((prev) => {
      const next = {
        ...prev,
        budget: fields.budget != null ? String(fields.budget) : prev.budget,
        currency: fields.currency ?? prev.currency,
        platformFeePercent:
          fields.platformFeePercent != null ? String(fields.platformFeePercent) : prev.platformFeePercent,
        estimatedHours: fields.estimatedHours != null ? String(fields.estimatedHours) : prev.estimatedHours,
        depositPercent: fields.depositPercent != null ? String(fields.depositPercent) : prev.depositPercent,
        paymentTermsDays:
          fields.paymentTermsDays != null ? String(fields.paymentTermsDays) : prev.paymentTermsDays,
        allowedRevisions:
          fields.allowedRevisions != null ? String(fields.allowedRevisions) : prev.allowedRevisions,
        flags: fields.flags ?? prev.flags,
      };

      // After extraction, immediately mark any still-empty required fields as
      // touched so their inline error appears right away — Smart Paste never
      // fills targetRate (it's the user's personal target rate, not in the
      // client's message per PRD §3.3), so this signals clearly what needs
      // filling before the user tries to submit.
      const emptyRequired = REQUIRED_NUMERIC.filter((key) => next[key].trim() === '');
      if (emptyRequired.length > 0) {
        setTouched((prev) => {
          const updated = { ...prev };
          for (const key of emptyRequired) updated[key] = true;
          return updated;
        });
      }

      return next;
    });
  }

  async function handleExtract(text: string) {
    if (!text.trim()) {
      setPaste({ status: 'error', message: 'Paste the client message first.' });
      return;
    }
    setPaste({ status: 'loading', message: null });
    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (response.ok && data && (data as { ok?: unknown }).ok === true) {
        const fields = (data as { fields: ExtractedFields }).fields;
        const resolved = Object.values(fields).filter((value) => value !== null).length;
        applyExtracted(fields);
        setFormOpen(true);
        setInternalExpanded(true);
        if (onExpand) onExpand();

        // Build a message that calls out any still-empty required fields so the
        // user (and TestSprite) knows exactly what still needs filling.
        const stillEmpty = REQUIRED_NUMERIC.filter((key) => {
          const extracted = fields[key as keyof ExtractedFields];
          return extracted === null || extracted === undefined;
        });
        const missingNote =
          stillEmpty.length > 0
            ? ` — ${FIELD_LABELS[stillEmpty[0] as FormFieldKey]}${stillEmpty.length > 1 ? ` and ${stillEmpty.length - 1} other field${stillEmpty.length > 2 ? 's' : ''}` : ''} still need${stillEmpty.length === 1 ? 's' : ''} your input.`
            : '';

        setPaste(
          resolved > 0
            ? {
                status: 'success',
                message: `Extracted ${resolved} of 8 fields — review and adjust below, then analyze.${missingNote}`,
              }
            : { status: 'error', message: 'No offer details found in that message — fill the form manually.' },
        );
      } else {
        // graceful fallback: manual entry, never blocks the core flow (PRD §3.3)
        setFormOpen(true);
        setInternalExpanded(true);
        if (onExpand) onExpand();
        setPaste({ status: 'error', message: "Couldn't extract from that message — fill the form manually." });
      }
    } catch {
      setFormOpen(true);
      setInternalExpanded(true);
      if (onExpand) onExpand();
      setPaste({ status: 'error', message: "Couldn't extract — check your connection and fill the form manually." });
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const allTouched = Object.fromEntries(FORM_FIELD_KEYS.map((key) => [key, true])) as Record<
      FormFieldKey,
      boolean
    >;
    setTouched(allTouched);

    const hasBlocking = FORM_FIELD_KEYS.some((key) => errorFor(key, true) !== null);
    if (hasBlocking) {
      setSubmitError(null); // the inline field errors say what and where (PRD §3.5.2)
      return;
    }

    const payload = buildPayloadFromForm(form);
    const selfCheck = OfferInputSchema.safeParse(payload);
    if (!selfCheck.success) {
      const map: Partial<Record<FormFieldKey, string>> = {};
      for (const issue of zodToIssues(selfCheck.error) as ValidationIssue[]) {
        if (issue.field && !issue.field.includes('.')) map[issue.field as FormFieldKey] = issue.message;
      }
      setServerFieldErrors(map);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data: unknown = await response.json().catch(() => null);

      if (response.status === 201 && data && typeof (data as { id?: unknown }).id === 'string') {
        const id = (data as { id: string }).id;
        addMyOffer(id);
        router.push(`/result/${id}`);
        return; // keep the progress state during the redirect (PRD §3.5.2)
      }

      if (
        response.status === 400 &&
        data &&
        (data as { error?: unknown }).error === 'VALIDATION_ERROR' &&
        Array.isArray((data as { issues?: unknown }).issues)
      ) {
        const map: Partial<Record<FormFieldKey, string>> = {};
        for (const issue of (data as { issues: ValidationIssue[] }).issues) {
          if (issue.field && !issue.field.includes('.')) map[issue.field as FormFieldKey] = issue.message;
        }
        setServerFieldErrors(map);
      } else {
        setSubmitError(
          (data as { message?: unknown } | null)?.message as string | undefined ??
          'Something went wrong while saving the offer. Try again.',
        );
      }
      setSubmitting(false);
    } catch {
      setSubmitError('Could not reach the server — check your connection and try again.');
      setSubmitting(false);
    }
  }

  return (
    <section
      id="analyze"
      className={cn(
        'mx-auto w-full max-w-[700px] transition-all duration-500 ease-out',
        !isExpanded
          ? 'pointer-events-none my-0 max-h-0 overflow-hidden opacity-0'
          : 'my-6 max-h-[3500px] opacity-100 animate-fade-up',
      )}
    >
      <div className="card-volta p-5 md:p-7">
        <SmartPasteBox status={paste.status} message={paste.message} onExtract={handleExtract} />

        <PresetChips className="mt-5" onApply={applyPreset} activeId={activePresetId} />

        <button
          type="button"
          onClick={() => setFormOpen((open) => !open)}
          aria-expanded={formOpen}
          className="mt-5 flex items-center gap-1.5 text-sm font-medium text-ink-300 transition-colors hover:text-ink-100"
        >
          Or enter manually
          <CaretDown className={cn('size-4 transition-transform duration-300', formOpen && 'rotate-180')} weight="light" />
        </button>

        {formOpen && (
          <div
            className={cn(
              'mt-5 grid items-start gap-6',
              gaugeVisible && 'lg:grid-cols-[minmax(0,1fr)_280px]',
            )}
          >
            <form
              id="offer-form"
              onSubmit={handleSubmit}
              noValidate
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              <OfferForm
                key={`${activePresetId ?? 'manual'}-${presetRevision}`}
                form={form}
                errors={errors}
                onFieldChange={handleFieldChange}
                onFieldBlur={handleFieldBlur}
                onFlagToggle={handleFlagToggle}
              />
            </form>

            {riskView && (
              <aside className="animate-fade-up lg:sticky lg:top-24 lg:self-start">
                <LiveRiskGauge {...riskView} />
              </aside>
            )}

            <div className="animate-fade-up">
              <button
                form="offer-form"
                type="submit"
                disabled={submitting}
                className="btn-volta-cta flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Spinner className="size-3.5 text-white" />
                    Analyzing your offer…
                  </>
                ) : (
                  'Analyze this offer'
                )}
              </button>
              {submitError && <p className="mt-2 text-xs text-reject">{submitError}</p>}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
