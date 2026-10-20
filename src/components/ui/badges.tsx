import { cn } from '@/lib/utils';
import type { RecommendAction, RiskTier } from '@/lib/engine/types';

const TIER_STYLES: Record<RiskTier, string> = {
  LOW: 'pill-3d-green',
  MEDIUM: 'pill-3d-yellow',
  HIGH: 'pill-3d-red',
};

const ACTION_STYLES: Record<RecommendAction, string> = {
  ACCEPT: 'pill-3d-green',
  NEGOTIATE: 'pill-3d-yellow',
  REJECT: 'pill-3d-red',
};

export function TierBadge({ tier }: { tier: RiskTier }) {
  return (
    <span
      className={cn(
        'pill-3d px-2.5 py-0.5 text-xs font-semibold tracking-wider text-white select-none',
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
        'pill-3d px-2.5 py-0.5 text-xs font-semibold tracking-wider text-white select-none',
        ACTION_STYLES[action],
      )}
    >
      {action}
    </span>
  );
}
