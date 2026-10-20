import { cn } from '@/lib/utils';
import type { RecommendAction } from '@/lib/engine/types';

const ACTION_COLORS: Record<RecommendAction, string> = {
  ACCEPT: 'text-accept',
  NEGOTIATE: 'text-negotiate',
  REJECT: 'text-reject',
};

/**
 * Decision badge card (PRD §4.3) styled with the unified glass theme and uppercase card header.
 */
export default function DecisionBadge({ action, reason }: { action: RecommendAction; reason: string }) {
  return (
    <div className="glass animate-reveal-badge rounded-2xl p-6">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">Verdict</div>
      <div className={cn('mt-1.5 text-3xl font-bold tracking-[0.08em] md:text-4xl', ACTION_COLORS[action])}>
        {action}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink-300">{reason}</p>
    </div>
  );
}
