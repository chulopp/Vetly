'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { ActionBadge, TierBadge } from '@/components/ui/badges';
import { formatMoney } from '@/lib/currency';
import { formatMargin } from '@/lib/engine';
import type { RecommendAction, RiskTier } from '@/lib/engine/types';
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
 * Client-side sortable table for the Compare page (PRD §4.3).
 * Receives server-fetched offers as props — data loading is done in the
 * parent Server Component (compare/page.tsx) via the my_offers cookie.
 */
export function CompareTable({ offers }: { offers: OfferRecord[] }) {
  const router = useRouter();
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'createdAt', dir: 'desc' });

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
  }

  const currencies = new Set(offers.map((offer) => offer.input.currency));
  const mixedCurrencies = currencies.size > 1;

  return (
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
  );
}
