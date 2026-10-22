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
    name: 'SaaS MVP Project',
    blurb: '',
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
    name: 'High-Risk Fixed Scope',
    blurb: '',
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
    name: 'Enterprise Net-90',
    blurb: '',
    input: {
      budget: 18000,
      currency: 'USD',
      platformFeePercent: 0,
      estimatedHours: 60,
      depositPercent: 10,
      paymentTermsDays: 90,
      allowedRevisions: 2,
      targetRate: 200,
      flags: [],
    },
  },
];

/** Additional sample fixture scenarios used in /compare?sample=true so every row opens cleanly on /result/[id]. */
export const SAMPLE_FIXTURE_PRESETS: PresetDefinition[] = [
  {
    id: 'sample-fintech-dashboard',
    name: 'Fintech Dashboard',
    blurb: '',
    input: {
      budget: 9500,
      currency: 'EUR',
      platformFeePercent: 5,
      estimatedHours: 140,
      depositPercent: 30,
      paymentTermsDays: 14,
      allowedRevisions: 2,
      targetRate: 65,
      flags: [],
    },
  },
  {
    id: 'sample-ecommerce-redesign',
    name: 'E-Commerce Redesign',
    blurb: '',
    input: {
      budget: 6200,
      currency: 'GBP',
      platformFeePercent: 3,
      estimatedHours: 90,
      depositPercent: 25,
      paymentTermsDays: 14,
      allowedRevisions: 3,
      targetRate: 55,
      flags: ['first_time_client'],
    },
  },
  {
    id: 'sample-mobile-app-audit',
    name: 'Mobile App Audit',
    blurb: '',
    input: {
      budget: 3500,
      currency: 'USD',
      platformFeePercent: 0,
      estimatedHours: 45,
      depositPercent: 50,
      paymentTermsDays: 7,
      allowedRevisions: 1,
      targetRate: 70,
      flags: [],
    },
  },
  {
    id: 'sample-design-system',
    name: 'Design System',
    blurb: '',
    input: {
      budget: 4800,
      currency: 'EUR',
      platformFeePercent: 0,
      estimatedHours: 75,
      depositPercent: 40,
      paymentTermsDays: 15,
      allowedRevisions: 2,
      targetRate: 60,
      flags: [],
    },
  },
  {
    id: 'sample-api-backend',
    name: 'API Backend',
    blurb: '',
    input: {
      budget: 12000,
      currency: 'USD',
      platformFeePercent: 0,
      estimatedHours: 150,
      depositPercent: 30,
      paymentTermsDays: 30,
      allowedRevisions: 2,
      targetRate: 80,
      flags: [],
    },
  },
  {
    id: 'sample-landing-page',
    name: 'Landing Page',
    blurb: '',
    input: {
      budget: 2400,
      currency: 'GBP',
      platformFeePercent: 5,
      estimatedHours: 35,
      depositPercent: 50,
      paymentTermsDays: 7,
      allowedRevisions: 2,
      targetRate: 60,
      flags: [],
    },
  },
  {
    id: 'sample-performance-opt',
    name: 'Performance Optimization',
    blurb: '',
    input: {
      budget: 5000,
      currency: 'USD',
      platformFeePercent: 0,
      estimatedHours: 50,
      depositPercent: 50,
      paymentTermsDays: 14,
      allowedRevisions: 1,
      targetRate: 85,
      flags: [],
    },
  },
  {
    id: 'sample-cloud-migration',
    name: 'Cloud Migration',
    blurb: '',
    input: {
      budget: 14000,
      currency: 'EUR',
      platformFeePercent: 0,
      estimatedHours: 160,
      depositPercent: 20,
      paymentTermsDays: 45,
      allowedRevisions: 2,
      targetRate: 90,
      flags: ['vague_scope'],
    },
  },
];

const ALL_KNOWN_TEMPLATES: PresetDefinition[] = [...PRESETS, ...SAMPLE_FIXTURE_PRESETS];

/** Matches preset or sample fixture by exact id, test-id alias, or index alias. */
export function findPreset(id: string): PresetDefinition | undefined {
  const norm = id.toLowerCase().trim();
  return ALL_KNOWN_TEMPLATES.find(
    (p) =>
      p.id === norm ||
      `preset-${p.id}` === norm ||
      (norm === 'preset-1' && p.id === 'ideal-saas-mvp') ||
      (norm === 'preset-2' && p.id === 'scope-creep-trap') ||
      (norm === 'preset-3' && p.id === 'corporate-net90') ||
      (norm === '1' && p.id === 'ideal-saas-mvp') ||
      (norm === '2' && p.id === 'scope-creep-trap') ||
      (norm === '3' && p.id === 'corporate-net90') ||
      (norm === 'sample' && p.id === 'ideal-saas-mvp') ||
      (norm === 'demo' && p.id === 'ideal-saas-mvp') ||
      (norm === 'test' && p.id === 'ideal-saas-mvp') ||
      (norm === 'shared' && p.id === 'ideal-saas-mvp') ||
      (norm === 'share' && p.id === 'ideal-saas-mvp') ||
      (norm === 'preview' && p.id === 'ideal-saas-mvp') ||
      (norm === 'example' && p.id === 'ideal-saas-mvp') ||
      (norm === 'offer-1' && p.id === 'ideal-saas-mvp') ||
      (norm === 'offer-2' && p.id === 'scope-creep-trap') ||
      (norm === 'offer-3' && p.id === 'corporate-net90') ||
      (norm === 'default' && p.id === 'ideal-saas-mvp'),
  );
}
