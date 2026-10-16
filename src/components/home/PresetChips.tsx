'use client';

import { Building2, Sparkles, TriangleAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { OfferInput } from '@/lib/engine/types';
import { cn } from '@/lib/utils';

export interface Preset {
  id: string;
  name: string;
  blurb: string;
  icon: LucideIcon;
  input: OfferInput;
}

/** The three 1-click preset scenarios (PRD §3.5.3) — locked plan decision #4 values. */
export const PRESETS: Preset[] = [
  {
    id: 'ideal-saas-mvp',
    name: 'Ideal SaaS MVP',
    blurb: 'Fair margin, zero risk — an easy accept.',
    icon: Sparkles,
    input: {
      budget: 8000,
      currency: 'USD',
      platformFeePercent: 3,
      estimatedHours: 120,
      depositPercent: 50,
      paymentTermsDays: 7,
      allowedRevisions: 2,
      targetRate: 50,
      flags: [],
    },
  },
  {
    id: 'scope-creep-trap',
    name: 'Scope Creep Trap',
    blurb: 'Deep deficit, every red flag — reject fast.',
    icon: TriangleAlert,
    input: {
      budget: 1500,
      currency: 'USD',
      platformFeePercent: 10,
      estimatedHours: 80,
      depositPercent: 0,
      paymentTermsDays: 30,
      allowedRevisions: 2,
      targetRate: 30,
      flags: ['unlimited_revisions', 'vague_scope', 'no_contract'],
    },
  },
  {
    id: 'corporate-net90',
    name: 'High-Pay Corporate Net-90',
    blurb: 'Great rate, risky terms — negotiate.',
    icon: Building2,
    input: {
      budget: 18000,
      currency: 'USD',
      platformFeePercent: 0,
      estimatedHours: 60,
      depositPercent: 25,
      paymentTermsDays: 90,
      allowedRevisions: 3,
      targetRate: 200,
      flags: [],
    },
  },
];

interface PresetChipsProps {
  onApply: (input: OfferInput) => void;
  className?: string;
}

export default function PresetChips({ onApply, className }: PresetChipsProps) {
  return (
    <div className={cn('grid gap-2.5 sm:grid-cols-3', className)}>
      {PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          onClick={() => onApply(preset.input)}
          className="glass rounded-xl px-3.5 py-3 text-left transition-all hover:border-white/25 hover:bg-white/[0.08] active:scale-[0.98]"
        >
          <span className="flex items-center gap-2">
            <preset.icon className="size-4 shrink-0 text-ink-300" />
            <span className="text-sm font-medium text-ink-100">{preset.name}</span>
          </span>
          <span className="mt-1 block text-[11px] leading-snug text-ink-500">{preset.blurb}</span>
        </button>
      ))}
    </div>
  );
}
