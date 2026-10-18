'use client';

import type { OfferInput } from '@/lib/engine/types';
import { cn } from '@/lib/utils';
import { PRESETS, type Preset } from '@/lib/presets';

export { PRESETS };
export type { Preset };

interface PresetChipsProps {
  onApply: (input: OfferInput, id?: string) => void;
  activeId?: string | null;
  className?: string;
}

export default function PresetChips({ onApply, activeId, className }: PresetChipsProps) {
  return (
    <div className={cn('grid gap-2.5 sm:grid-cols-3', className)}>
      {PRESETS.map((preset) => {
        const isActive = activeId === preset.id;
        return (
          <button
            key={preset.id}
            type="button"
            aria-pressed={isActive}
            data-testid={`preset-${preset.id}`}
            data-state={isActive ? 'active' : 'inactive'}
            onClick={() => onApply(preset.input, preset.id)}
            className={cn(
              'glass rounded-xl px-3.5 py-3 text-left transition-all active:scale-[0.98]',
              isActive
                ? 'border-ink-100/50 bg-white/[0.12] ring-1 ring-white/20'
                : 'hover:border-white/25 hover:bg-white/[0.08]',
            )}
          >
            <span className="flex items-center gap-2">
              <preset.icon
                className={cn('size-4 shrink-0 transition-colors', isActive ? 'text-ink-100' : 'text-ink-300')}
              />
              <span className={cn('text-sm font-medium', isActive ? 'text-white' : 'text-ink-100')}>
                {preset.name}
              </span>
            </span>
            <span className="mt-1 block text-[11px] leading-snug text-ink-500">{preset.blurb}</span>
          </button>
        );
      })}
    </div>
  );
}
