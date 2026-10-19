'use client';

import { useEffect, useRef, useState } from 'react';
import { RiskBar } from '@/components/ui/RiskBar';
import { TierBadge } from '@/components/ui/badges';
import type { RiskContribution, RiskTier, TierProximity } from '@/lib/engine/types';
import { cn } from '@/lib/utils';

interface LiveRiskGaugeProps {
  score: number;
  tier: RiskTier;
  proximity: TierProximity;
  contributions: RiskContribution[];
  assumingDefaults: boolean;
}

/** Tweens the displayed score so changes read as movement, not a jump cut. */
function useAnimatedNumber(target: number, duration = 380): number {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 2; // easeOutQuad
      setDisplay(Math.round(from + (target - from) * eased));
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return display;
}

/**
 * Live risk-score widget (PRD §4.2 Step 2, §3.5.3): driven by the same pure
 * risk functions the API uses, run client-side before submission, with the
 * boundary-proximity display so the user sees the tier and its distance move
 * in real time.
 */
export default function LiveRiskGauge({ score, tier, proximity, contributions, assumingDefaults }: LiveRiskGaugeProps) {
  const animatedScore = useAnimatedNumber(score);

  return (
    <div className="glass rounded-2xl p-5">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">Live client risk</div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-4xl font-semibold tnum text-ink-100">{animatedScore}</span>
        <span className="text-sm text-ink-500">/ 100</span>
      </div>
      <div className="mt-2.5">
        <TierBadge tier={tier} />
      </div>
      <p className="mt-2 text-xs text-ink-300">{proximity.message}</p>
      <RiskBar score={score} />
      <ul className="mt-4 space-y-1.5">
        {contributions.map((contribution) => (
          <li key={contribution.source} className="flex items-center justify-between gap-2 text-xs">
            <span className="text-ink-300">
              {contribution.label} <span className="text-ink-500">({contribution.detail})</span>
            </span>
            <span
              className={cn(
                'font-semibold tnum',
                contribution.points > 0 ? 'text-reject' : 'text-accept',
              )}
            >
              +{contribution.points}
            </span>
          </li>
        ))}
      </ul>
      {assumingDefaults && (
        <p className="mt-3 text-[11px] leading-snug text-ink-500">
          Deposit and terms assumed 0. Enter values to refine score.
        </p>
      )}
    </div>
  );
}
