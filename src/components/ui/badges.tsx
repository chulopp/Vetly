import { cn } from '@/lib/utils';
import type { RecommendAction, RiskTier } from '@/lib/engine/types';

const TIER_STYLES: Record<RiskTier, string> = {
  LOW: 'border-accept/30 bg-accept/15 text-accept',
  MEDIUM: 'border-negotiate/30 bg-negotiate/15 text-negotiate',
  HIGH: 'border-reject/30 bg-reject/15 text-reject',
};

const ACTION_STYLES: Record<RecommendAction, string> = {
  ACCEPT: 'border-accept/30 bg-accept/15 text-accept',
  NEGOTIATE: 'border-negotiate/30 bg-negotiate/15 text-negotiate',
  REJECT: 'border-reject/30 bg-reject/15 text-reject',
};

export function TierBadge({ tier }: { tier: RiskTier }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide',
        TIER_STYLES[tier],
      )}
    >
      {tier} RISK
    </span>
  );
}

export function ActionBadge({ action }: { action: RecommendAction }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide',
        ACTION_STYLES[action],
      )}
    >
      {action}
    </span>
  );
}
