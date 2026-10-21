'use client';

import { useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { formatMoney } from '@/lib/currency';
import { formatMargin, trimNumber } from '@/lib/engine';
import type { RecommendAction } from '@/lib/engine/types';
import type { OfferRecord } from '@/lib/offers/service';
import { cn } from '@/lib/utils';

const ACTION_COLORS: Record<RecommendAction, string> = {
  ACCEPT: 'text-accept drop-shadow-[0_2px_16px_rgba(34,197,94,0.45)]',
  NEGOTIATE: 'text-negotiate drop-shadow-[0_2px_16px_rgba(245,158,11,0.45)]',
  REJECT: 'text-reject drop-shadow-[0_2px_16px_rgba(239,68,68,0.45)]',
};

// Rich Luminous Mesh Gradients with Diagonal Gradient Border (bright at top-left, fading to dark at bottom-right)
const ACTION_THEMES: Record<
  RecommendAction,
  {
    bgGradient: string;
    borderGradient: string;
    auraStyle: React.CSSProperties;
  }
> = {
  ACCEPT: {
    bgGradient:
      'linear-gradient(to bottom right, rgba(6, 59, 44, 0.88) 0%, rgba(7, 36, 29, 0.92) 45%, rgba(12, 18, 21, 0.96) 100%)',
    borderGradient:
      'linear-gradient(135deg, rgba(34, 197, 94, 0.50) 0%, rgba(16, 185, 129, 0.18) 35%, rgba(255, 255, 255, 0.06) 100%)',
    auraStyle: {
      background:
        'radial-gradient(circle at 18% 15%, rgba(16, 185, 129, 0.42) 0%, rgba(5, 150, 105, 0.16) 45%, transparent 75%)',
    },
  },
  NEGOTIATE: {
    bgGradient:
      'linear-gradient(to bottom right, rgba(69, 31, 5, 0.88) 0%, rgba(38, 21, 6, 0.92) 45%, rgba(15, 14, 19, 0.96) 100%)',
    borderGradient:
      'linear-gradient(135deg, rgba(245, 158, 11, 0.52) 0%, rgba(217, 119, 6, 0.18) 35%, rgba(255, 255, 255, 0.06) 100%)',
    auraStyle: {
      background:
        'radial-gradient(circle at 18% 15%, rgba(245, 158, 11, 0.45) 0%, rgba(217, 119, 6, 0.18) 45%, transparent 75%)',
    },
  },
  REJECT: {
    bgGradient:
      'linear-gradient(to bottom right, rgba(76, 5, 25, 0.88) 0%, rgba(41, 10, 18, 0.92) 45%, rgba(18, 14, 20, 0.96) 100%)',
    borderGradient:
      'linear-gradient(135deg, rgba(244, 63, 94, 0.52) 0%, rgba(225, 29, 72, 0.18) 35%, rgba(255, 255, 255, 0.06) 100%)',
    auraStyle: {
      background:
        'radial-gradient(circle at 18% 15%, rgba(244, 63, 94, 0.45) 0%, rgba(225, 29, 72, 0.18) 45%, transparent 75%)',
    },
  },
};

interface DecisionBadgeProps {
  action: RecommendAction;
  summary: string;
  offer?: OfferRecord;
}

/**
 * Builds a 100% comprehensive, beautifully structured Markdown report
 * covering all details from the analysis page, ready to paste anywhere.
 */
function buildFullMarkdownReport(offer: OfferRecord, summary: string): string {
  const { input, analysis } = offer;
  const money = (val: number) => formatMoney(val, input.currency);
  const marginStr = `${formatMargin(analysis.profitabilityMargin)}%`;

  const sections: string[] = [];

  // 1. Header & Verdict
  sections.push(`# Vetly Deal Analysis: ${analysis.recommendAction}`);
  sections.push(`> ${summary}`);

  // 2. Compensation & Rate
  const compLines = [
    `### Compensation & Rate Analysis`,
    `- **Effective Hourly Rate**: ${money(analysis.effectiveHourlyRate)}/hr *(what this deal really pays, per hour)*`,
    `- **Your Target Rate**: ${money(input.targetRate)}/hr *(what you need to earn)*`,
    `- **Profitability Margin**: ${marginStr} (${analysis.profitabilityMargin >= 0 ? 'Surplus' : 'Deficit'})`,
    `- **Quoted Budget**: ${money(input.budget)}`,
    `- **Platform / Payment Fee**: ${trimNumber(input.platformFeePercent)}%`,
    `- **Net Budget**: ${money(analysis.netBudget)}`,
    `- **Estimated Work**: ${trimNumber(input.estimatedHours)}h (Adjusted: ${trimNumber(analysis.adjustedHours)}h with 10% overhead${analysis.revisionPenalty > 0 ? ` + ${trimNumber(analysis.revisionPenalty * 100)}% revision buffer` : ''})`,
  ];
  sections.push(compLines.join('\n'));

  // 3. Client Risk Breakdown
  const riskLines = [
    `### Client Risk Assessment: ${analysis.riskScore}/100 (${analysis.riskTier} Risk)`,
  ];
  for (const c of analysis.riskContributions) {
    riskLines.push(`- **${c.label}**: ${c.detail} (+${c.points} pts)`);
  }
  sections.push(riskLines.join('\n'));

  // 4. Counter-Offer Recommendations (if any)
  if (analysis.counterOffer?.budgetTriggered) {
    const counterLines = [`### Counter-Offer Suggestions`];
    if (analysis.counterOffer.suggestedBudget != null) {
      counterLines.push(
        `- **Counter Budget**: ${money(analysis.counterOffer.suggestedBudget)} *(minimum to hit your target rate)*`,
      );
    }
    if (analysis.counterOffer.maxExecutableHours != null) {
      counterLines.push(
        `- **Max Executable Hours**: ${analysis.counterOffer.maxExecutableHours} hrs *(at current budget)*`,
      );
    }
    sections.push(counterLines.join('\n'));
  }

  // 5. Required Contract Conditions (if any)
  if (analysis.counterOffer?.riskTriggered && analysis.counterOffer.contractConditions.length > 0) {
    const condLines = [`### Required Terms Before Starting`];
    for (const cond of analysis.counterOffer.contractConditions) {
      condLines.push(`- ${cond}`);
    }
    sections.push(condLines.join('\n'));
  }

  // 6. AI Negotiation Message (if already drafted)
  if (offer.draftMessage) {
    sections.push(`### Ready-to-Send Negotiation Message\n\`\`\`text\n${offer.draftMessage}\n\`\`\``);
  }

  // 7. Share Link
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/share/${offer.id}`
      : `https://vetly-cut.vercel.app/share/${offer.id}`;
  sections.push(`---\n*Analyzed with Vetly: ${shareUrl}*`);

  return sections.join('\n\n');
}

/**
 * Main Decision Box with Rich 3D Luminous Mesh Gradient,
 * Diagonal Gradient Border (bright at top-left, dark at bottom-right),
 * a plain-English 1-sentence verdict summary, and a sleek "Copy result" action.
 */
export default function DecisionBadge({ action, summary, offer }: DecisionBadgeProps) {
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const theme = ACTION_THEMES[action];

  async function handleCopyResult() {
    if (!offer) return;
    const text = buildFullMarkdownReport(offer, summary);
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
        'group relative overflow-hidden rounded-2xl p-6 md:p-7 backdrop-blur-2xl transition-all duration-300 animate-reveal-badge',
      )}
      style={{
        border: '1px solid transparent',
        backgroundImage: `${theme.bgGradient}, ${theme.borderGradient}`,
        backgroundOrigin: 'padding-box, border-box',
        backgroundClip: 'padding-box, border-box',
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
        {/* Header row with Title and Sleek Glass Pill Copy Result Button */}
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-400">
            Verdict
          </div>
          {offer && (
            <button
              type="button"
              onClick={handleCopyResult}
              aria-label={copied ? 'Result copied' : 'Copy result'}
              title={copied ? 'Copied to clipboard!' : 'Copy full result to clipboard'}
              className="flex items-center gap-1.5 rounded-xl px-2 py-1 text-xs font-medium text-ink-300 transition-colors hover:bg-white/[0.08] hover:text-white active:scale-95"
            >
              {copied ? (
                <Check className="size-3.5 text-accept" />
              ) : (
                <Copy className="size-3.5" />
              )}
              <span role="status" aria-live="polite">
                {copied ? 'Copied!' : 'Copy result'}
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
