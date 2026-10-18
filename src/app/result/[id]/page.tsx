import type { Metadata } from 'next';
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
import { getOffer, type OfferRecord } from '@/lib/offers/service';
import { OFFER_ID_PATTERN } from '@/lib/validation/offer';

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
  if (!OFFER_ID_PATTERN.test(id)) return { title: 'Offer not found — Vetly' };
  const { offer } = await loadOffer(id);
  if (!offer) return { title: 'Offer not found — Vetly' };
  return {
    title: `${offer.analysis.recommendAction} — Vetly offer analysis`,
    description: offer.analysis.decisionReason,
  };
}

/**
 * Result page (PRD §4.3): two columns on desktop — the narrative ("why") on
 * the left, the action ("now what") sticky on the right — stacking to one
 * column in the same priority order on mobile. Doubles as the public shared
 * view: ownership (localStorage) only toggles the owner toolbar.
 */
export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!OFFER_ID_PATTERN.test(id)) notFound();

  const { offer, dbError } = await loadOffer(id);
  if (dbError) return <DbUnavailableCard />;
  if (!offer) notFound();

  const { analysis } = offer;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-24">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* left column — the narrative: why this verdict */}
        <div className="flex min-w-0 flex-col gap-6">
          <DecisionBadge action={analysis.recommendAction} reason={analysis.decisionReason} />
          <RateComparison offer={offer} />
          <RiskBreakdown analysis={analysis} />
        </div>

        {/* right column — the action: what to do about it */}
        <div className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          {analysis.counterOffer?.budgetTriggered && (
            <CounterOfferCard counterOffer={analysis.counterOffer} currency={offer.input.currency} />
          )}
          {analysis.counterOffer?.riskTriggered && (
            <ContractConditions counterOffer={analysis.counterOffer} />
          )}
          {analysis.counterOffer && <DraftMessage offerId={offer.id} />}
          <OwnerActions offerId={offer.id} />
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
