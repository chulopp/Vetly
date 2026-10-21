import { ChevronDown } from 'lucide-react';
import { formatMoney } from '@/lib/currency';
import { formatMargin, trimNumber } from '@/lib/engine';
import type { OfferRecord } from '@/lib/offers/service';
import { cn } from '@/lib/utils';

/**
 * Unified Rate & Profitability Card (PRD §4.3 + UI redesign):
 * Combines Effective Rate, Target Rate, and Profitability Margin into 1 cohesive card
 * featuring a visual horizontal comparison bar with two pinned markers (Target vs Actual)
 * and a color-coded margin delta segment.
 */
export default function RateComparison({ offer }: { offer: OfferRecord }) {
  const { input, analysis } = offer;
  const money = (amount: number) => formatMoney(amount, input.currency);
  const actualRate = analysis.effectiveHourlyRate;
  const targetRate = input.targetRate;
  const margin = analysis.profitabilityMargin;
  const isSurplus = margin >= 0;

  // Visual Gauge Calculation:
  // Dynamically compute baseline and ceiling window so the gap between target and actual
  // is always visually clear, intuitive, and proportional.
  const spread = Math.abs(actualRate - targetRate);
  const buffer = Math.max(spread * 1.4, targetRate * 0.22);
  const baseline = Math.max(0, Math.min(actualRate, targetRate) - buffer);
  const ceiling = Math.max(actualRate, targetRate) + buffer;
  const span = ceiling - baseline || 1;

  // Normalized percentages (clamped to 8%..92% to prevent pin clipping at container edges)
  const rawActualPct = ((actualRate - baseline) / span) * 100;
  const rawTargetPct = ((targetRate - baseline) / span) * 100;
  const actualPos = Math.min(92, Math.max(8, rawActualPct));
  const targetPos = Math.min(92, Math.max(8, rawTargetPct));

  const segmentLeft = Math.min(actualPos, targetPos);
  const segmentWidth = Math.max(2, Math.abs(actualPos - targetPos));

  return (
    <div className="glass animate-fade-up rounded-2xl p-6 md:p-7">
      {/* Top Header & Margin Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">
          Rate &amp; Profitability
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tnum tracking-wide',
              isSurplus
                ? 'border border-accept/30 bg-accept/15 text-accept'
                : 'border border-reject/30 bg-reject/15 text-reject',
            )}
          >
            {isSurplus ? `${formatMargin(margin)}% surplus` : `${formatMargin(margin)}% deficit`}
          </span>
        </div>
      </div>

      {/* Side-by-side Numbers */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {/* Effective Rate */}
        <div className="rounded-xl border border-white/5 bg-white/[0.025] p-4 transition-colors hover:border-white/10">
          <div className="flex items-center gap-1.5 text-xs font-medium text-ink-400">
            <span className="size-2 rounded-full bg-ink-200" />
            Effective hourly rate
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-ink-100 sm:text-3xl tnum">
            {money(actualRate)}
          </div>
          <div className="mt-1 text-[11px] text-ink-500">what this deal really pays, per hour</div>
        </div>

        {/* Target Rate */}
        <div className="rounded-xl border border-white/5 bg-white/[0.025] p-4 transition-colors hover:border-white/10">
          <div className="flex items-center gap-1.5 text-xs font-medium text-ink-400">
            <span className="size-2 rounded-full border border-white/40 bg-transparent" />
            Your target rate
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-ink-300 sm:text-3xl tnum">
            {money(targetRate)}
          </div>
          <div className="mt-1 text-[11px] text-ink-500">what you need to earn, per hour</div>
        </div>
      </div>

      {/* Horizontal Comparison Visual Gauge Bar */}
      <div className="mt-8 rounded-xl border border-white/5 bg-white/[0.02] p-4 sm:p-5">
        <div className="text-[11px] font-medium text-ink-500">
          <span>Comparison Visualizer</span>
        </div>

        {/* The Track with 2 Pins & Delta Segment */}
        <div className="relative mt-8 mb-7 pt-4 pb-4">
          {/* Base Track */}
          <div className="h-2 w-full rounded-full bg-white/[0.08]" />

          {/* Colored Margin Segment between Target and Actual */}
          <div
            className={cn(
              'absolute top-4 h-2 rounded-full transition-all duration-500',
              isSurplus
                ? 'border-y border-accept/50 bg-accept/30 shadow-[0_0_12px_rgba(34,197,94,0.3)]'
                : 'border-y border-reject/50 bg-reject/30 shadow-[0_0_12px_rgba(239,68,68,0.3)]',
            )}
            style={{
              left: `${segmentLeft}%`,
              width: `${segmentWidth}%`,
            }}
          />

          {/* Target Rate Pin (Label positioned BELOW the track to avoid collision) */}
          <div
            className="group absolute top-4 -translate-x-1/2 transition-all duration-500"
            style={{ left: `${targetPos}%` }}
          >
            {/* Track indicator dot */}
            <div className="relative -top-1 size-4 rounded-full border-2 border-white/70 bg-base-950 shadow-sm transition-transform group-hover:scale-125" />
            {/* Pin pointer & label */}
            <div className="absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap pt-1 text-center">
              <span className="block text-[10px] font-medium uppercase tracking-wider text-ink-500">
                Target
              </span>
              <span className="block text-xs font-semibold text-ink-300 tnum">
                {money(targetRate)}
              </span>
            </div>
          </div>

          {/* Actual Effective Rate Pin (Label positioned ABOVE the track to avoid collision) */}
          <div
            className="group absolute top-4 -translate-x-1/2 transition-all duration-500"
            style={{ left: `${actualPos}%` }}
          >
            {/* Pin pointer & label above */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap pb-1 text-center">
              <span
                className={cn(
                  'block text-[10px] font-semibold uppercase tracking-wider',
                  isSurplus ? 'text-accept' : 'text-reject',
                )}
              >
                Actual
              </span>
              <span
                className={cn(
                  'block text-xs font-bold tnum',
                  isSurplus ? 'text-white' : 'text-ink-100',
                )}
              >
                {money(actualRate)}
              </span>
            </div>
            {/* Track indicator dot */}
            <div
              className={cn(
                'relative -top-1 size-4 rounded-full border-2 bg-white transition-transform group-hover:scale-125',
                isSurplus
                  ? 'border-accept shadow-[0_0_10px_rgba(34,197,94,0.7)]'
                  : 'border-reject shadow-[0_0_10px_rgba(239,68,68,0.7)]',
              )}
            />
          </div>
        </div>
      </div>

      {/* Collapsible Calculation Breakdown */}
      <details className="mt-4 border-t border-white/5 pt-3">
        <summary className="flex cursor-pointer list-none items-center gap-1 text-xs text-ink-500 transition-colors hover:text-ink-300 [&::-webkit-details-marker]:hidden">
          <ChevronDown className="size-3.5 transition-transform duration-300 [[open]>&]:rotate-180" />
          How this rate was computed
        </summary>
        <ul className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-ink-300 tnum">
          <li>
            Net budget {money(analysis.netBudget)} = {money(input.budget)} budget −{' '}
            {trimNumber(input.platformFeePercent)}% platform fee
          </li>
          <li>
            Adjusted hours {trimNumber(analysis.adjustedHours)}h = {trimNumber(input.estimatedHours)}h × (1 + 10%
            overhead
            {analysis.revisionPenalty > 0
              ? ` + ${trimNumber(analysis.revisionPenalty * 100)}% revision buffer`
              : ''}
            )
          </li>
          <li>
            Effective rate = {money(analysis.netBudget)} ÷ {trimNumber(analysis.adjustedHours)}h, rounded to 2
            decimals
          </li>
        </ul>
      </details>
    </div>
  );
}
