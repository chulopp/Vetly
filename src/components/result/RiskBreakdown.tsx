import { RiskBar } from '@/components/ui/RiskBar';
import { TierBadge } from '@/components/ui/badges';
import type { AnalysisResult } from '@/lib/engine/types';
import { cn } from '@/lib/utils';

/** Risk breakdown (PRD §4.3): total score, tier, distance to next tier, and which factors contributed how many points. */
export default function RiskBreakdown({ analysis }: { analysis: AnalysisResult }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">Client risk</div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold tnum text-ink-100">{analysis.riskScore}</span>
            <span className="text-sm text-ink-500">/ 100</span>
          </div>
        </div>
        <TierBadge tier={analysis.riskTier} />
      </div>
      <p className="mt-1.5 text-xs text-ink-300">{analysis.riskProximity.message}</p>
      <RiskBar score={analysis.riskScore} />

      <ul className="mt-4 space-y-2">
        {analysis.riskContributions.map((contribution) => (
          <li
            key={contribution.source}
            className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3.5 py-2.5"
          >
            <span className="text-sm">
              <span className="font-medium text-ink-100">{contribution.label}</span>{' '}
              <span className="text-xs text-ink-500">({contribution.detail})</span>
            </span>
            <span
              className={cn(
                'text-sm font-semibold tnum',
                contribution.points > 0 ? 'text-reject' : 'text-accept',
              )}
            >
              +{contribution.points} pts
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
