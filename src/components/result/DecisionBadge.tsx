'use client';

import { useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { formatMoney } from '@/lib/currency';
import { formatMargin } from '@/lib/engine';
import type { RecommendAction } from '@/lib/engine/types';
import type { OfferRecord } from '@/lib/offers/service';
import { cn } from '@/lib/utils';

const ACTION_COLORS: Record<RecommendAction, string> = {
  ACCEPT: 'text-accept drop-shadow-[0_2px_16px_rgba(34,197,94,0.45)]',
  NEGOTIATE: 'text-negotiate drop-shadow-[0_2px_16px_rgba(245,158,11,0.45)]',
  REJECT: 'text-reject drop-shadow-[0_2px_16px_rgba(239,68,68,0.45)]',
};

// Rich Luminous Mesh Gradients that make the color vivid and unmistakable
const ACTION_THEMES: Record<
  RecommendAction,
  {
    baseGradient: string;
    auraStyle: React.CSSProperties;
    borderClass: string;
  }
> = {
  ACCEPT: {
    baseGradient: 'from-[#063b2c]/85 via-[#07241d]/90 to-[#0c1215]/95',
    auraStyle: {
      background:
        'radial-gradient(circle at 18% 15%, rgba(16, 185, 129, 0.42) 0%, rgba(5, 150, 105, 0.16) 45%, transparent 75%)',
    },
    borderClass: 'border-emerald-500/30',
  },
  NEGOTIATE: {
    baseGradient: 'from-[#451f05]/85 via-[#261506]/90 to-[#0f0e13]/95',
    auraStyle: {
      background:
        'radial-gradient(circle at 18% 15%, rgba(245, 158, 11, 0.45) 0%, rgba(217, 119, 6, 0.18) 45%, transparent 75%)',
    },
    borderClass: 'border-amber-500/30',
  },
  REJECT: {
    baseGradient: 'from-[#4c0519]/85 via-[#290a12]/90 to-[#120e14]/95',
    auraStyle: {
      background:
        'radial-gradient(circle at 18% 15%, rgba(244, 63, 94, 0.45) 0%, rgba(225, 29, 72, 0.18) 45%, transparent 75%)',
    },
    borderClass: 'border-rose-500/30',
  },
};

interface DecisionBadgeProps {
  action: RecommendAction;
  summary: string;
  offer?: OfferRecord;
}

function buildAnalysisText(offer: OfferRecord, summary: string): string {
  const { input, analysis } = offer;
  const money = (val: number) => formatMoney(val, input.currency);
  const lines = [
    `Vetly Deal Analysis: ${analysis.recommendAction}`,
    `Verdict: ${summary}`,
    '',
    'Key Metrics:',
    `• Effective Hourly Rate: ${money(analysis.effectiveHourlyRate)}/hr`,
    `• Target Hourly Rate: ${money(input.targetRate)}/hr`,
    `• Profitability Margin: ${formatMargin(analysis.profitabilityMargin)}%`,
    `• Client Risk Score: ${analysis.riskScore}/100 (${analysis.riskTier})`,
  ];

  if (analysis.counterOffer?.budgetTriggered) {
    lines.push('');
    lines.push('Counter-Offer Suggestions:');
    if (analysis.counterOffer.suggestedBudget != null) {
      lines.push(`• Counter Budget: ${money(analysis.counterOffer.suggestedBudget)}`);
    }
    if (analysis.counterOffer.maxExecutableHours != null) {
      lines.push(`• Max Hours at Current Budget: ${analysis.counterOffer.maxExecutableHours} hrs`);
    }
  }

  if (analysis.counterOffer?.riskTriggered && analysis.counterOffer.contractConditions.length > 0) {
    lines.push('');
    lines.push('Required Terms:');
    for (const cond of analysis.counterOffer.contractConditions) {
      lines.push(`• ${cond}`);
    }
  }

  lines.push('');
  lines.push('Analyzed with Vetly: https://vetly-cut.vercel.app');
  return lines.join('\n');
}

/**
 * Main Decision Box with Rich 3D Luminous Mesh Gradient, clear tactile depth,
 * a plain-English 1-sentence verdict summary, and a sleek "Copy analysis" action.
 */
export default function DecisionBadge({ action, summary, offer }: DecisionBadgeProps) {
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const theme = ACTION_THEMES[action];

  async function handleCopyAnalysis() {
    if (!offer) return;
    const text = buildAnalysisText(offer, summary);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.focus();
      el.select();
      try {
        document.execCommand('copy');
      } finally {
        document.body.removeChild(el);
      }
    }
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    setCopied(true);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 2400);
  }

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 md:p-7 backdrop-blur-2xl transition-all duration-300 animate-reveal-badge',
        theme.borderClass,
        theme.baseGradient,
      )}
      style={{
        boxShadow:
          'inset 0 1px 1px 0 rgba(255, 255, 255, 0.22), inset 0 -2px 10px 0 rgba(0, 0, 0, 0.5), 0 16px 36px -6px rgba(0, 0, 0, 0.6)',
      }}
    >
      {/* Rich Luminous Inner Mesh/Radial Aura */}
      <div
        className="pointer-events-none absolute -inset-6 opacity-95 blur-2xl transition-all duration-500"
        style={theme.auraStyle}
        aria-hidden="true"
      />

      {/* Top specular reflection line */}
      <div
        className="pointer-events-none absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent"
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* Header row with Title and Sleek Glass Pill Copy Analysis Button */}
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-400">
            Verdict
          </div>
          {offer && (
            <button
              type="button"
              onClick={handleCopyAnalysis}
              aria-label={copied ? 'Analysis copied' : 'Copy analysis result'}
              title={copied ? 'Copied to clipboard!' : 'Copy full analysis to clipboard'}
              className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-ink-300 transition-all hover:border-white/30 hover:bg-white/10 hover:text-white active:scale-95"
            >
              {copied ? (
                <Check className="size-3.5 text-accept" />
              ) : (
                <Copy className="size-3.5" />
              )}
              <span role="status" aria-live="polite">
                {copied ? 'Copied!' : 'Copy analysis'}
              </span>
            </button>
          )}
        </div>

        <div
          className={cn(
            'mt-2 text-3xl font-extrabold tracking-[0.06em] md:text-4xl',
            ACTION_COLORS[action],
          )}
        >
          {action}
        </div>

        <p className="mt-3.5 text-sm font-medium leading-relaxed text-ink-100 md:text-[15px]">
          {summary}
        </p>
      </div>
    </div>
  );
}
