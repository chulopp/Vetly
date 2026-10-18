import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ContractConditions from '@/components/result/ContractConditions';
import CounterOfferCard from '@/components/result/CounterOfferCard';
import DecisionBadge from '@/components/result/DecisionBadge';
import DraftMessage from '@/components/result/DraftMessage';
import OwnerActions from '@/components/result/OwnerActions';
import RateComparison from '@/components/result/RateComparison';
import RiskBreakdown from '@/components/result/RiskBreakdown';
import { DatabaseNotConfiguredError } from '@/lib/db/client';
import { analyzeOffer } from '@/lib/engine';
import { getOffer, type OfferRecord } from '@/lib/offers/service';
import { findPreset } from '@/lib/presets';
import { OFFER_ID_PATTERN } from '@/lib/validation/offer';
import { cookieOwnsOffer, COOKIE_NAME } from '@/lib/ownershipCookie';

async function loadOffer(id: string): Promise<{ offer: OfferRecord | null; dbError: boolean }> {
  try {
    return { offer: await getOffer(id), dbError: false };
  } catch (error) {
    if (!(error instanceof DatabaseNotConfiguredError)) {
      console.error('[result page] failed to load offer:', error);
    }
    return { offer: null, dbError: true };
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (!OFFER_ID_PATTERN.test(id)) return { title: 'Offer not found - Vetly' };
  const { offer } = await loadOffer(id);
  if (!offer) return { title: 'Offer not found - Vetly' };
  return {
    title: `${offer.analysis.recommendAction} - Vetly offer analysis`,
    description: offer.analysis.decisionReason,
  };
}

/**
 * Result page (PRD §4.3): two columns on desktop - the narrative ("why") on
 * the left, the action ("now what") sticky on the right - stacking to one
 * column in the same priority order on mobile. Doubles as the public shared
 * view: ownership (localStorage) only toggles the owner toolbar.
 */
export const dynamic = 'force-dynamic';

export default async function ResultPage({
  params,
  searchParams,
  forceShared = false,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
  forceShared?: boolean;
}) {
  const { id } = await params;
  const search = searchParams ? await searchParams : {};
  const isForcedShared =
    forceShared ||
    search.shared !== undefined ||
    search.view === 'shared' ||
    search.readonly !== undefined ||
    search.public !== undefined;

  if (!OFFER_ID_PATTERN.test(id)) notFound();

  const { offer, dbError } = await loadOffer(id);

  if (dbError) return <DbUnavailableCard />;
  if (!offer) notFound();

  // Presets are demo templates and never owned by individual sessions
  const isPreset = Boolean(findPreset(offer.id) || findPreset(id));

  // Server-side ownership check: read the my_offers cookie (set by POST /api/offers).
  // If the offer id is in the cookie, this is the owner's browser — show owner controls.
  // Forced-shared routes (share/[id], ?shared, ?readonly, ?public) and presets are always visitor.
  const cookieStore = await cookies();
  const myOffersCookie = cookieStore.get(COOKIE_NAME)?.value;
  const isOwner = !isForcedShared && !isPreset && cookieOwnsOffer(myOffersCookie, offer.id);

  const { analysis } = offer;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-24">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* left column - the narrative: why this verdict */}
        <div className="flex min-w-0 flex-col gap-6">
          <DecisionBadge action={analysis.recommendAction} reason={analysis.decisionReason} />
          <RateComparison offer={offer} />
          <RiskBreakdown analysis={analysis} />
        </div>

        {/* right column - the action: what to do about it */}
        <div className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          {analysis.counterOffer?.budgetTriggered && (
            <CounterOfferCard counterOffer={analysis.counterOffer} currency={offer.input.currency} />
          )}
          {analysis.counterOffer?.riskTriggered && (
            <ContractConditions counterOffer={analysis.counterOffer} />
          )}
          {analysis.counterOffer && <DraftMessage offerId={offer.id} />}
          <OwnerActions offerId={offer.id} isOwner={isOwner} />
        </div>
      </div>
    </main>
  );
}

function DbUnavailableCard() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center px-4 pt-20 text-center">
      <div className="glass animate-fade-up rounded-3xl p-10">
        <h1 className="text-xl font-semibold text-ink-100">Saved offers aren&apos;t available right now.</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-300">
          The analysis database isn&apos;t configured yet — try again in a moment.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-ink-100 px-5 py-2.5 text-sm font-semibold text-base-950 transition hover:bg-white"
          >
            Analyze your own deal
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-ink-300 transition hover:border-white/30 hover:text-ink-100"
          >
            Back to analyzing deals
          </Link>
        </div>
      </div>
    </main>
  );
}
