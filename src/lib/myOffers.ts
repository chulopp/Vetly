'use client';

/**
 * Client-side "ownership" of saved offers (PRD §4.1): the offer data lives in
 * Neon, addressed by id; this browser's saved offers are just an array of ids
 * in localStorage. No accounts, no auth.
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
