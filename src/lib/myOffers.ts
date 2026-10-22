'use client';

import type { OfferRecord } from '@/lib/offers/service';

/**
 * Client-side localStorage mirror for the offers saved in this browser
 * (PRD v7 §3.1).
 *
 * IMPORTANT: localStorage is a convenience cache only — it is NOT the
 * authoritative ownership record. The server-set `my_offers` cookie is what
 * /result/[id] and /compare trust server-side to decide ownership. This module
 * exists purely so client-side UI can reflect ownership state instantly (e.g.
 * while a navigation is in flight) without waiting for a server round-trip.
 *
 * The cookie is set/updated by POST /api/offers on every successful offer
 * creation via src/lib/ownershipCookie.ts.
 */

const STORAGE_KEY = 'myOffers';
const CACHE_STORAGE_KEY = 'myOffers_cached_records';
export const MAX_OFFERS = 50;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export function getMyOffers(): string[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw === null ? [] : JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string');
  } catch {
    return [];
  }
}

export function addMyOffer(id: string): void {
  if (!isBrowser()) return;
  try {
    const existing = getMyOffers().filter((existingId) => existingId !== id);
    existing.push(id);
    const trimmed = existing.length > MAX_OFFERS ? existing.slice(existing.length - MAX_OFFERS) : existing;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // storage unavailable (private mode etc.) — the offer is still saved server-side
  }
}

export function ownsOffer(id: string): boolean {
  return getMyOffers().includes(id);
}

export function getCachedOffers(): OfferRecord[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    const parsed: unknown = raw === null ? [] : JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as OfferRecord[];
  } catch {
    return [];
  }
}

export function saveCachedOffer(record: OfferRecord): void {
  if (!isBrowser()) return;
  try {
    const existing = getCachedOffers().filter((r) => r.id !== record.id);
    existing.unshift(record);
    const trimmed = existing.slice(0, MAX_OFFERS);
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // storage unavailable
  }
}
