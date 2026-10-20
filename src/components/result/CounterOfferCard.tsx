import { formatMoney } from '@/lib/currency';
import type { CounterOffer } from '@/lib/engine/types';

/**
 * Counter-offer card (PRD §4.3): renders only when the margin triggered it,
 * framed as "a reasonable number to counter with" — a mathematically sound
 * starting point for negotiation, never a promise of outcome (PRD §1).
 * Numbers sit on solid panels above the glass card.
 */
export default function CounterOfferCard({
  counterOffer,
  currency,
}: {
  counterOffer: CounterOffer;
  currency: string;
}) {
  return (
    <div className="glass animate-fade-up rounded-2xl p-5">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">
        Your counter-offer
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-500">
        A reasonable number to counter with. A starting point for negotiation, not a guarantee the
        client will accept it.
      </p>

      <div className="mt-4 space-y-3">
        {counterOffer.suggestedBudget != null && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs text-ink-500">Ask for a budget of</div>
            <div className="mt-1 text-2xl font-semibold tnum text-ink-100">
              {formatMoney(counterOffer.suggestedBudget, currency)}
            </div>
            <div className="mt-1 text-[11px] leading-snug text-ink-500">
              the minimum budget that makes your effective rate exactly hit your target, after fees
              and realistic hours
            </div>
          </div>
        )}

        {counterOffer.maxExecutableHours != null && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs text-ink-500">Or cap the work at</div>
            <div className="mt-1 text-2xl font-semibold tnum text-ink-100">
              {counterOffer.maxExecutableHours}
              <span className="ml-1.5 text-sm font-normal text-ink-300">estimated hours</span>
            </div>
            <div className="mt-1 text-[11px] leading-snug text-ink-500">
              {counterOffer.maxExecutableHours === 0
                ? 'the current budget cannot fund even one overhead-adjusted hour at your target rate'
                : 'the most hours to plan at the current budget and still hit your target rate, with fees, overhead, and revision buffer included'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
