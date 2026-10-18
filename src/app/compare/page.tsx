import Link from 'next/link';
import { cookies } from 'next/headers';
import { Plus } from 'lucide-react';
import { DatabaseNotConfiguredError } from '@/lib/db/client';
import { listOffers } from '@/lib/offers/service';
import { COOKIE_NAME, parseMyCookie } from '@/lib/ownershipCookie';
import type { OfferRecord } from '@/lib/offers/service';
import { CompareTable } from './CompareTable';

/**
 * Compare page (PRD v7 §4.3): reads the my_offers cookie server-side (same
 * single source of truth as /result/[id]), fetches each offer from Neon, and
 * passes them to the client-side sortable CompareTable component.
 *
 * localStorage is NOT used here — the cookie is authoritative for ownership
 * across both pages (see PRD v7 §3.1 / §4.1).
 */
export default async function ComparePage() {
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(COOKIE_NAME)?.value;
  const ids = parseMyCookie(rawCookie ? decodeURIComponent(rawCookie) : undefined);

  let offers: OfferRecord[] = [];
  let loadError = false;

  if (ids.length > 0) {
    try {
      offers = await listOffers(ids);
    } catch (error) {
      if (!(error instanceof DatabaseNotConfiguredError)) {
        console.error('[compare page] failed to load offers:', error);
      }
      loadError = true;
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
          className="flex items-center gap-1.5 rounded-xl bg-ink-100 px-4 py-2.5 text-sm font-semibold text-base-950 transition hover:bg-white"
        >
          <Plus className="size-4" />
          New analysis
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
      ) : offers.length === 0 ? (
        <div className="glass mx-auto mt-8 flex max-w-md flex-col items-center rounded-3xl p-10 text-center animate-fade-up">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/vetly-icon.png" alt="" className="h-14 w-auto" />
          <h2 className="mt-5 text-lg font-semibold text-ink-100">No saved offers yet</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-300">
            Analyze your first project offer and it&apos;ll show up here — ready to compare side
            by side.
          </p>
          <Link
            href="/?intake=open"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ink-100 px-5 py-2.5 text-sm font-semibold text-base-950 transition hover:bg-white"
          >
            <Plus className="size-4" />
            Analyze your first offer
          </Link>
        </div>
      ) : (
        <CompareTable offers={offers} />
      )}
    </main>
  );
}
