'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, ArrowUpDown, Plus } from 'lucide-react';
import { ActionBadge, TierBadge } from '@/components/ui/badges';
import { Spinner } from '@/components/ui/Spinner';
import { formatMoney } from '@/lib/currency';
import { formatMargin } from '@/lib/engine';
import type { RecommendAction, RiskTier } from '@/lib/engine/types';
import { getMyOffers } from '@/lib/myOffers';
import type { OfferRecord } from '@/lib/offers/service';
import { cn } from '@/lib/utils';

type SortKey =
  | 'createdAt'
  | 'budget'
  | 'effectiveHourlyRate'
  | 'profitabilityMargin'
  | 'riskTier'
  | 'recommendAction';
type SortDir = 'asc' | 'desc';

const TIER_RANK: Record<RiskTier, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 };
const ACTION_RANK: Record<RecommendAction, number> = { ACCEPT: 0, NEGOTIATE: 1, REJECT: 2 };

const COLUMNS: Array<{ key: SortKey; label: string }> = [
  { key: 'budget', label: 'Budget' },
  { key: 'effectiveHourlyRate', label: 'Effective rate' },
  { key: 'profitabilityMargin', label: 'Margin' },
  { key: 'riskTier', label: 'Risk tier' },
  { key: 'recommendAction', label: 'Decision' },
];

/**
 * Compare page (PRD §4.3): reads the myOffers ids from localStorage, fetches
 * each from the database, and shows a sortable table — budget (native
 * currency), effective rate, margin, risk tier, decision. Clicking a row
 * navigates to that offer's result. Designed empty state before any offer
 * is saved.
 */
export default function ComparePage() {
  const router = useRouter();
  const [offers, setOffers] = useState<OfferRecord[] | null>(null); // null = loading
  const [loadError, setLoadError] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'createdAt', dir: 'desc' });

  useEffect(() => {
    const ids = getMyOffers();
    if (ids.length === 0) {
      setOffers([]);
      return;
    }
    fetch(`/api/offers?ids=${ids.map((id) => encodeURIComponent(id)).join(',')}`)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('load failed'))))
      .then((data: { offers?: unknown }) => setOffers(Array.isArray(data?.offers) ? (data.offers as OfferRecord[]) : []))
      .catch(() => {
        setOffers([]);
        setLoadError(true);
      });
  }, []);

  const sorted = useMemo(() => {
    const list = [...(offers ?? [])];
    const dir = sort.dir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      switch (sort.key) {
        case 'createdAt':
          return dir * (Date.parse(a.createdAt) - Date.parse(b.createdAt));
        case 'budget':
          return dir * (a.input.budget - b.input.budget);
        case 'effectiveHourlyRate':
          return dir * (a.analysis.effectiveHourlyRate - b.analysis.effectiveHourlyRate);
        case 'profitabilityMargin':
          return dir * (a.analysis.profitabilityMargin - b.analysis.profitabilityMargin);
        case 'riskTier':
          return dir * (TIER_RANK[a.analysis.riskTier] - TIER_RANK[b.analysis.riskTier]);
        case 'recommendAction':
          return dir * (ACTION_RANK[a.analysis.recommendAction] - ACTION_RANK[b.analysis.recommendAction]);
      }
    });
    return list;
  }, [offers, sort]);

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'createdAt' ? 'desc' : 'asc' },
    );
  }

  const currencies = new Set((offers ?? []).map((offer) => offer.input.currency));
  const mixedCurrencies = currencies.size > 1;

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

      {offers === null && (
        <div className="glass mt-6 flex items-center gap-3 rounded-2xl p-8 text-sm text-ink-300">
          <Spinner />
          Loading your saved offers…
        </div>
      )}

      {offers !== null && offers.length === 0 && (
        <>
          {loadError ? (
            <div className="glass mt-6 rounded-2xl p-8 text-center">
              <p className="text-sm text-ink-300">Couldn&apos;t load your saved offers.</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 rounded-xl bg-ink-100 px-5 py-2.5 text-sm font-semibold text-base-950 transition hover:bg-white"
              >
                Try again
              </button>
            </div>
          ) : (
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
          )}
        </>
      )}

      {offers !== null && offers.length > 0 && (
        <>
          {mixedCurrencies && (
            <p className="mt-5 text-xs text-ink-500">
              Each amount is shown in its offer&apos;s native currency.
            </p>
          )}
          <div className="glass mt-4 overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    {COLUMNS.map((column) => (
                      <th key={column.key} className="px-4 py-3 text-left">
                        <button
                          type="button"
                          onClick={() => toggleSort(column.key)}
                          className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-500 transition-colors hover:text-ink-300"
                          aria-label={`Sort by ${column.label}`}
                        >
                          {column.label}
                          {sort.key === column.key ? (
                            sort.dir === 'asc' ? (
                              <ArrowUp className="size-3" />
                            ) : (
                              <ArrowDown className="size-3" />
                            )
                          ) : (
                            <ArrowUpDown className="size-3 opacity-40" />
                          )}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((offer) => (
                    <tr
                      key={offer.id}
                      tabIndex={0}
                      onClick={() => router.push(`/result/${offer.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') router.push(`/result/${offer.id}`);
                      }}
                      className="cursor-pointer border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.04] focus-visible:bg-white/[0.04] focus-visible:outline-none"
                    >
                      <td className="px-4 py-3.5 tnum text-ink-100">
                        {formatMoney(offer.input.budget, offer.input.currency)}
                      </td>
                      <td className="px-4 py-3.5 tnum text-ink-100">
                        {formatMoney(offer.analysis.effectiveHourlyRate, offer.input.currency)}
                      </td>
                      <td
                        className={cn(
                          'px-4 py-3.5 tnum font-medium',
                          offer.analysis.profitabilityMargin >= 0 ? 'text-accept' : 'text-reject',
                        )}
                      >
                        {formatMargin(offer.analysis.profitabilityMargin)}%
                      </td>
                      <td className="px-4 py-3.5">
                        <TierBadge tier={offer.analysis.riskTier} />
                      </td>
                      <td className="px-4 py-3.5">
                        <ActionBadge action={offer.analysis.recommendAction} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-3 text-xs text-ink-500">Click a row to open the full analysis.</p>
        </>
      )}
    </main>
  );
}
