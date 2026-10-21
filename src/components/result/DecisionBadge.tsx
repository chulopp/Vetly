import { cn } from '@/lib/utils';
import type { RecommendAction } from '@/lib/engine/types';

const ACTION_COLORS: Record<RecommendAction, string> = {
  ACCEPT: 'text-accept drop-shadow-[0_2px_12px_rgba(34,197,94,0.35)]',
  NEGOTIATE: 'text-negotiate drop-shadow-[0_2px_12px_rgba(245,158,11,0.35)]',
  REJECT: 'text-reject drop-shadow-[0_2px_12px_rgba(239,68,68,0.35)]',
};

const ACTION_AURAS: Record<RecommendAction, string> = {
  ACCEPT: 'from-emerald-500/[0.18] via-emerald-600/[0.05] to-transparent',
  NEGOTIATE: 'from-amber-500/[0.20] via-amber-600/[0.06] to-transparent',
  REJECT: 'from-rose-500/[0.22] via-rose-600/[0.07] to-transparent',
};

interface DecisionBadgeProps {
  action: RecommendAction;
  summary: string;
}

/**
 * Main Decision Box (PRD §4.3) with 3D dark glass styling, tailored luminous inner aura,
 * and a direct, plain-English synthesis sentence replacing technical matrix reasons.
 */
export default function DecisionBadge({ action, summary }: DecisionBadgeProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c0d12]/90 p-6 md:p-7 backdrop-blur-2xl transition-all duration-300 animate-reveal-badge',
      )}
      style={{
        boxShadow:
          'inset 0 1px 1px 0 rgba(255, 255, 255, 0.16), inset 0 -2px 10px 0 rgba(0, 0, 0, 0.5), 0 12px 32px -4px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* 3D Convex Inner Luminous Aura (No outer border glow, blends seamlessly into base) */}
      <div
        className={cn(
          'pointer-events-none absolute -top-12 left-1/2 h-44 w-[120%] -translate-x-1/2 rounded-full bg-gradient-to-b blur-2xl transition-opacity duration-500',
          ACTION_AURAS[action],
        )}
        aria-hidden="true"
      />

      {/* Subtle top specular reflection line */}
      <div
        className="pointer-events-none absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"
        aria-hidden="true"
      />

      <div className="relative z-10">
        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">
          Verdict
        </div>
        <div
          className={cn(
            'mt-1.5 text-3xl font-extrabold tracking-[0.06em] md:text-4xl',
            ACTION_COLORS[action],
          )}
        >
          {action}
        </div>
        <p className="mt-3 text-sm font-medium leading-relaxed text-ink-100 md:text-[15px]">
          {summary}
        </p>
      </div>
    </div>
  );
}
