/**
 * Server-side cookie helpers for offer ownership (PRD v7 §3.1).
 *
 * The `my_offers` cookie is the single authoritative record of which offer IDs
 * belong to the current browser session. It is set by the server on every
 * successful POST /api/offers and read server-side by /result/[id] and
 * /compare — nothing server-rendered trusts localStorage for ownership.
 *
 * Cookie attributes: HttpOnly, SameSite=Lax, Path=/, Max-Age=30 days,
 * Secure in production. Capped at 50 IDs (oldest dropped on overflow) to
 * stay well within the ~4 KB cookie limit.
 *
 * NOTE: this module must never be imported from 'use client' components — it
 * is server-only (reads/writes Set-Cookie headers). Client-side mirroring
 * uses src/lib/myOffers.ts (localStorage) as a convenience cache only.
 */

export const COOKIE_NAME = 'my_offers';
const MAX_IDS = 50;
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

/** Parse the raw cookie value into an array of offer IDs. */
export function parseMyCookie(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    let text = raw.trim();
    // Strip RFC 6265 surrounding quotes if present
    if (text.startsWith('"') && text.endsWith('"') && text.length >= 2) {
      text = text.slice(1, -1).trim();
    }
    if (text.includes('%')) {
      try {
        text = decodeURIComponent(text);
      } catch {
        // ignore URI decode error and try JSON.parse directly
      }
    }
    if (text.startsWith('"') && text.endsWith('"') && text.length >= 2) {
      text = text.slice(1, -1).trim();
    }
    let parsed: unknown = JSON.parse(text);
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        return [];
      }
    }
    if (Array.isArray(parsed)) {
      return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0);
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Build a complete Set-Cookie header value for the my_offers cookie.
 * Trims to MAX_IDS, keeping the most recently added (tail of array).
 */
export function buildMyCookie(ids: string[]): string {
  const trimmed = ids.length > MAX_IDS ? ids.slice(ids.length - MAX_IDS) : ids;
  const value = encodeURIComponent(JSON.stringify(trimmed));
  const isProduction = process.env.NODE_ENV === 'production';
  const parts = [
    `${COOKIE_NAME}=${value}`,
    `Path=/`,
    `Max-Age=${MAX_AGE}`,
    `SameSite=Lax`,
    `HttpOnly`,
  ];
  if (isProduction) parts.push('Secure');
  return parts.join('; ');
}

/**
 * Return true if the given offer ID is present in the my_offers cookie value.
 * Safe to call with undefined (returns false).
 */
export function cookieOwnsOffer(
  cookieValue: string | undefined,
  offerId: string,
): boolean {
  return parseMyCookie(cookieValue).includes(offerId);
}
