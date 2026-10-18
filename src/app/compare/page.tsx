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
export const dynamic = 'force-dynamic';

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

  const ids = [...new Set([...queryIds, ...cookieIds])].slice(-50);

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
      ) : (
        <CompareTable initialOffers={offers} />
      )}
    </main>
  );
}
