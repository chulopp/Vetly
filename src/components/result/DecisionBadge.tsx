import { cn } from '@/lib/utils';
import type { RecommendAction } from '@/lib/engine/types';

const STYLES: Record<RecommendAction, { solid: string; glow: string }> = {
  ACCEPT: { solid: 'bg-accept text-[#04130a]', glow: 'glow-accept' },
  NEGOTIATE: { solid: 'bg-negotiate text-[#1f1403]', glow: 'glow-negotiate' },
  REJECT: { solid: 'bg-reject text-[#1c0605]', glow: 'glow-reject' },
};

/**
 * Large, SOLID color decision badge (PRD §4.3) — never glass: stacking two
 * transparent materials kills contrast. Subtle reveal on load.
 */
export default function DecisionBadge({ action, reason }: { action: RecommendAction; reason: string }) {
  const styles = STYLES[action];
  return (
    <div className={cn('animate-reveal-badge rounded-2xl px-6 py-5', styles.solid, styles.glow)}>
      <div className="text-2xl font-bold tracking-[0.08em] md:text-3xl">{action}</div>
      <p className="mt-2 text-sm font-medium leading-relaxed opacity-80">{reason}</p>
    </div>
  );
}
