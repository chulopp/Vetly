'use client';

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
    const ids = new Set(getMyOffers());
    ids.add(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // storage unavailable (private mode etc.) — the offer is still saved server-side
  }
}

export function ownsOffer(id: string): boolean {
  return getMyOffers().includes(id);
}
