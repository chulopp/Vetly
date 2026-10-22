import Link from 'next/link';
import { cookies } from 'next/headers';
import { Plus } from '@phosphor-icons/react/dist/ssr';
import { DatabaseNotConfiguredError } from '@/lib/db/client';
import { listOffers } from '@/lib/offers/service';
import { COOKIE_NAME, parseMyCookie } from '@/lib/ownershipCookie';
import type { OfferRecord } from '@/lib/offers/service';
import { analyzeOffer } from '@/lib/engine';
import type { OfferInput } from '@/lib/engine/types';
import { CompareTable } from './CompareTable';

const SAMPLE_FIXTURE_INPUTS: Array<{ id: string; input: OfferInput }> = [
  {
    id: 'ideal-saas-mvp',
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
  {
    id: 'sample-fintech-dashboard',
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

function getSampleFixtureOffers(): OfferRecord[] {
  const now = new Date();
  return SAMPLE_FIXTURE_INPUTS.map((item, index) => ({
    id: item.id,
    input: item.input,
    analysis: analyzeOffer(item.input),
    createdAt: new Date(now.getTime() - index * 3600000).toISOString(),
  }));
}

/**
 * Compare page (PRD v7 §4.3): reads the my_offers cookie server-side (same
 * single source of truth as /result/[id]), fetches each offer from Neon, and
 * passes them to the client-side sortable CompareTable component.
 *
 * localStorage is NOT used here — the cookie is authoritative for ownership
 * across both pages (see PRD v7 §3.1 / §4.1).
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function ComparePage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const search = searchParams ? await searchParams : {};
  const queryIds =
    typeof search.ids === 'string'
      ? search.ids.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(COOKIE_NAME)?.value;
  const cookieIds = parseMyCookie(rawCookie);

  const isFixture = search.fixture === 'true' || search.demo === 'true' || search.sample === 'true';

  let offers: OfferRecord[] = [];
  let loadError = false;

  if (isFixture) {
    offers = getSampleFixtureOffers();
  } else {
    const effectiveIds = [...new Set([...queryIds, ...cookieIds])].slice(-50);
    if (effectiveIds.length > 0) {
      try {
        offers = await listOffers(effectiveIds);
      } catch (error) {
        if (!(error instanceof DatabaseNotConfiguredError)) {
          console.error('[compare page] failed to load offers:', error);
        }
        loadError = true;
      }
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink-100 md:text-2xl">My saved offers</h1>
          <p className="mt-1 text-sm text-ink-500">
            Every offer you&apos;ve analyzed on this device, side by side.
          </p>
        </div>
        <Link
          href="/"
          className="btn-volta-cta flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-white sm:px-4 sm:py-2 sm:text-sm active:scale-[0.98]"
        >
          <Plus className="size-3.5 sm:size-4 text-white" weight="light" />
          <span>New analysis</span>
        </Link>
      </div>

      {loadError ? (
        <div className="glass mt-6 rounded-2xl p-8 text-center">
          <p className="text-sm text-ink-300">Couldn&apos;t load your saved offers.</p>
          <form action="">
            <button
              type="submit"
              className="mt-4 rounded-xl bg-ink-100 px-5 py-2.5 text-sm font-semibold text-base-950 transition hover:bg-white"
            >
              Try again
            </button>
          </form>
        </div>
      ) : (
        <CompareTable initialOffers={offers} />
      )}
    </main>
  );
}
