import type { OfferInput } from '@/lib/engine/types';

export interface PresetDefinition {
  id: string;
  name: string;
  blurb: string;
  input: OfferInput;
}

/** The three 1-click preset scenarios (PRD §3.5.3) — locked plan decision #4 values. */
export const PRESETS: PresetDefinition[] = [
  {
    id: 'ideal-saas-mvp',
    name: 'Ideal SaaS MVP',
    blurb: 'Fair margin, zero risk — an easy accept.',
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
    input: {
      budget: 18000,
      currency: 'USD',
      platformFeePercent: 0,
      estimatedHours: 100,
      depositPercent: 10,
      paymentTermsDays: 90,
      allowedRevisions: 2,
      targetRate: 200,
      flags: [],
    },
  },
];

/** Matches preset by exact id, test-id alias, or index alias. */
export function findPreset(id: string): PresetDefinition | undefined {
  const norm = id.toLowerCase().trim();
  return PRESETS.find(
    (p) =>
      p.id === norm ||
      `preset-${p.id}` === norm ||
      (norm === 'preset-1' && p.id === 'ideal-saas-mvp') ||
      (norm === 'preset-2' && p.id === 'scope-creep-trap') ||
      (norm === 'preset-3' && p.id === 'corporate-net90') ||
      (norm === 'sample' && p.id === 'ideal-saas-mvp') ||
      (norm === 'demo' && p.id === 'ideal-saas-mvp'),
  );
}
