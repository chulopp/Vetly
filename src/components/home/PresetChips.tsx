'use client';

import type { ComponentType } from 'react';
import { RocketLaunch, Warning, Buildings, type IconProps } from '@phosphor-icons/react';
import type { OfferInput } from '@/lib/engine/types';
import { cn } from '@/lib/utils';
import { PRESETS as PRESET_DATA, type PresetDefinition } from '@/lib/presets';

type PhosphorIcon = ComponentType<IconProps>;

const PRESET_ICONS: Record<string, PhosphorIcon> = {
  'ideal-saas-mvp': RocketLaunch,
  'scope-creep-trap': Warning,
  'corporate-net90': Buildings,
};

export interface Preset extends PresetDefinition {
  icon: PhosphorIcon;
}

export const PRESETS: Preset[] = PRESET_DATA.map((p) => ({
  ...p,
  icon: PRESET_ICONS[p.id] ?? RocketLaunch,
}));

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
        const Icon = preset.icon;
        return (
          <button
            key={preset.id}
            type="button"
            aria-pressed={isActive}
            data-testid={`preset-${preset.id}`}
            data-state={isActive ? 'active' : 'inactive'}
            onClick={() => onApply(preset.input, preset.id)}
            className={cn(
              'glass flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-all sm:px-3.5 sm:py-2.5 active:scale-[0.98]',
              isActive
                ? 'border-ink-100/50 bg-white/[0.12] ring-1 ring-white/20'
                : 'hover:border-white/25 hover:bg-white/[0.08]',
            )}
          >
            <Icon
              weight="light"
              className={cn('size-4 shrink-0 transition-colors', isActive ? 'text-ink-100' : 'text-ink-300')}
            />
            <span className={cn('text-xs sm:text-sm font-medium leading-none', isActive ? 'text-white' : 'text-ink-100')}>
              {preset.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
