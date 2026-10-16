import { Check } from 'lucide-react';
import type { CounterOffer } from '@/lib/engine/types';

const FALLBACK_LINE =
  'Risk here comes from payment timing — secure a written agreement and consider milestone payments before starting.';

/**
 * Contract conditions (PRD §4.3): the checklist of terms to require, rendered
 * only when the risk tier triggered it. Condition strings are the exact
 * deterministic engine output (PRD §3.2 C).
 */
export default function ContractConditions({ counterOffer }: { counterOffer: CounterOffer }) {
  const conditions = counterOffer.contractConditions;

  return (
    <div className="glass animate-fade-up rounded-2xl p-5">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-negotiate">
        Require before you start
      </div>
      {conditions.length > 0 ? (
        <ul className="mt-3.5 space-y-2.5">
          {conditions.map((condition) => (
            <li key={condition} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-100">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-negotiate/40 bg-negotiate/15">
                <Check className="size-3 text-negotiate" />
              </span>
              {condition}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-ink-300">{FALLBACK_LINE}</p>
      )}
    </div>
  );
}
