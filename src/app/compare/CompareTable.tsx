'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { ActionBadge, TierBadge } from '@/components/ui/badges';
import { formatMoney } from '@/lib/currency';
import { formatMargin } from '@/lib/engine';
import type { RecommendAction, RiskTier } from '@/lib/engine/types';
import { getMyOffers } from '@/lib/myOffers';
import type { OfferRecord } from '@/lib/offers/service';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 10;

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
 * Client-side table for the Compare page (PRD §4.3).
 * Primary: uses server-fetched offers from my_offers cookie.
 * Resilient fallback: if server had no cookie, checks localStorage mirror once.
 * If no offers exist anywhere, shows the designed empty state.
 */
export function CompareTable({ initialOffers = [] }: { initialOffers?: OfferRecord[] }) {
  const router = useRouter();
  const [offers, setOffers] = useState<OfferRecord[]>(initialOffers);
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'createdAt', dir: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const fetchedRef = useRef(false);

  useEffect(() => {
    setOffers(initialOffers);
  }, [initialOffers]);

  useEffect(() => {
    // If server rendered an empty list, but this browser session has saved offer IDs in localStorage,
    // fetch them once as a client-side recovery fallback without looping.
    if (initialOffers.length === 0 && !fetchedRef.current) {
      const localIds = getMyOffers();
      if (localIds.length > 0) {
        fetchedRef.current = true;
        fetch(`/api/offers?ids=${encodeURIComponent(localIds.join(','))}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data && Array.isArray(data.offers) && data.offers.length > 0) {
              setOffers(data.offers);
            }
          })
          .catch(() => {});
      }
    }
  }, [initialOffers]);

  const sorted = useMemo(() => {
    const list = [...offers];
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
    setCurrentPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, sorted.length);
  const paginatedOffers = sorted.slice(startIndex, endIndex);

  if (offers.length === 0) {
    return (
      <div className="glass mx-auto mt-8 flex max-w-md flex-col items-center rounded-3xl p-10 text-center animate-fade-up">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/vetly-icon.png" alt="" className="h-14 w-auto" />
        <h2 className="mt-5 text-lg font-semibold text-ink-100">No saved offers yet</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-300">
          Analyze your first project offer and it&apos;ll show up here, ready to compare side
          by side.
        </p>
        <Link
          href="/?intake=open"
          className="btn-volta-cta mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white active:scale-[0.98]"
        >
          <Plus className="size-4 text-white" />
          <span>Analyze your first offer</span>
        </Link>
        <Link
          href="/compare?sample=true"
          className="mt-3 text-xs text-ink-400 transition hover:text-ink-200"
        >
          View sample comparison table ↗
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="glass mt-6 overflow-hidden rounded-2xl">
        <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
              {paginatedOffers.map((offer) => (
                <tr
                  key={offer.id}
                  tabIndex={0}
                  onClick={() => router.push(`/result/${offer.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') router.push(`/result/${offer.id}`);
                  }}
                  className="cursor-pointer border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.04] focus-visible:bg-white/[0.04] focus-visible:outline-none"
                >
                  <td className="px-4 py-3.5 tnum text-ink-100 font-medium">
                    <Link
                      href={`/result/${offer.id}`}
                      className="block hover:underline"
                    >
                      {formatMoney(offer.input.budget, offer.input.currency)}
                    </Link>
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
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <TierBadge tier={offer.analysis.riskTier} />
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <ActionBadge action={offer.analysis.recommendAction} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {sorted.length > PAGE_SIZE && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1 text-xs">
          <p className="text-ink-500">
            Showing <span className="tnum">{startIndex + 1}</span>–
            <span className="tnum">{endIndex}</span> of{' '}
            <span className="tnum">{sorted.length}</span> offers
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-ink-400 transition-colors hover:bg-white/[0.08] hover:text-white disabled:pointer-events-none disabled:opacity-25"
              aria-label="Previous page"
            >
              <ChevronLeft className="size-3.5" />
              <span>Prev</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={cn(
                    'h-7 min-w-7 rounded-lg px-2 text-xs transition-colors tnum',
                    safePage === pageNum
                      ? 'bg-white/15 font-semibold text-white shadow-sm'
                      : 'text-ink-400 hover:bg-white/[0.06] hover:text-ink-200',
                  )}
                  aria-current={safePage === pageNum ? 'page' : undefined}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-ink-400 transition-colors hover:bg-white/[0.08] hover:text-white disabled:pointer-events-none disabled:opacity-25"
              aria-label="Next page"
            >
              <span>Next</span>
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      <p className="mt-3 text-xs text-ink-500">Click a row to open the full analysis.</p>
    </>
  );
}
