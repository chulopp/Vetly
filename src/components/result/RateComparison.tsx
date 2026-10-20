import { ChevronDown } from 'lucide-react';
import { formatMoney } from '@/lib/currency';
import { formatMargin, trimNumber } from '@/lib/engine';
import type { OfferRecord } from '@/lib/offers/service';
import { cn } from '@/lib/utils';

/**
 * Effective rate vs. target, side by side (PRD §4.3): both numbers sit on
 * SOLID high-contrast panels — never glass. The margin block shows the
 * distance-to-next-threshold note, with a "how this was computed" detail
 * that keeps the formulas transparent.
 */
export default function RateComparison({ offer }: { offer: OfferRecord }) {
  const { input, analysis } = offer;
  const money = (amount: number) => formatMoney(amount, input.currency);
  const margin = analysis.profitabilityMargin;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="glass rounded-2xl p-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">
            Effective hourly rate
          </div>
          <div className="mt-2 text-3xl font-semibold tnum text-ink-100">
            {money(analysis.effectiveHourlyRate)}
          </div>
          <div className="mt-1 text-[11px] text-ink-500">what this deal really pays, per hour</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">
            Your target rate
          </div>
          <div className="mt-2 text-3xl font-semibold tnum text-ink-300">{money(input.targetRate)}</div>
          <div className="mt-1 text-[11px] text-ink-500">what you need to earn, per hour</div>
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">
            Profitability margin
          </div>
          <span
            className={cn('text-2xl font-semibold tnum', margin >= 0 ? 'text-accept' : 'text-reject')}
          >
            {formatMargin(margin)}%
          </span>
        </div>
        <p className="mt-1 text-xs text-ink-500">{analysis.marginProximity.message}</p>

        <details className="mt-3">
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
    </div>
  );
}
