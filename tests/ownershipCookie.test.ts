import { describe, it, expect } from 'vitest';
import {
  COOKIE_NAME,
  parseMyCookie,
  buildMyCookie,
  cookieOwnsOffer,
} from '@/lib/ownershipCookie';

describe('ownershipCookie', () => {
  describe('parseMyCookie', () => {
    it('returns empty array for undefined or empty string', () => {
      expect(parseMyCookie(undefined)).toEqual([]);
      expect(parseMyCookie('')).toEqual([]);
    });

    it('returns empty array for invalid JSON or non-array JSON', () => {
      expect(parseMyCookie('invalid-json')).toEqual([]);
      expect(parseMyCookie('{"id":"abc"}')).toEqual([]);
      expect(parseMyCookie('12345')).toEqual([]);
      expect(parseMyCookie('null')).toEqual([]);
    });

    it('parses valid JSON array of string IDs', () => {
      const ids = ['abc12345', 'def67890'];
      expect(parseMyCookie(JSON.stringify(ids))).toEqual(ids);
    });

    it('filters out non-string and empty string entries', () => {
      const mixed = JSON.stringify(['valid1', '', null, 42, 'valid2', {}]);
      expect(parseMyCookie(mixed)).toEqual(['valid1', 'valid2']);
    });

    it('handles URL-encoded cookie strings', () => {
      const ids = ['offer-1', 'offer-2'];
      const encoded = encodeURIComponent(JSON.stringify(ids));
      expect(parseMyCookie(encoded)).toEqual(ids);
    });
  });

  describe('buildMyCookie', () => {
    it('creates a Set-Cookie string with correct attributes', () => {
      const ids = ['offer-abc'];
      const cookieHeader = buildMyCookie(ids);

      expect(cookieHeader).toContain(`${COOKIE_NAME}=`);
      expect(cookieHeader).toContain('Path=/');
      expect(cookieHeader).toContain('Max-Age=2592000');
      expect(cookieHeader).toContain('SameSite=Lax');
      expect(cookieHeader).toContain('HttpOnly');
    });

    it('caps IDs to 50, keeping the newest ones (tail)', () => {
      const ids = Array.from({ length: 60 }, (_, i) => `id-${i}`);
      const cookieHeader = buildMyCookie(ids);

      // Extract value part
      const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
      expect(match).not.toBeNull();
      const rawValue = match![1];
      const parsedIds = parseMyCookie(rawValue);

      expect(parsedIds.length).toBe(50);
      expect(parsedIds[0]).toBe('id-10'); // oldest 10 dropped
      expect(parsedIds[49]).toBe('id-59'); // newest preserved
    });
  });

  describe('cookieOwnsOffer', () => {
    it('returns true when ID is present in cookie', () => {
      const ids = ['offer-123', 'offer-456'];
      const raw = encodeURIComponent(JSON.stringify(ids));
      expect(cookieOwnsOffer(raw, 'offer-123')).toBe(true);
      expect(cookieOwnsOffer(raw, 'offer-456')).toBe(true);
    });

    it('returns false when ID is not present', () => {
      const ids = ['offer-123'];
      const raw = encodeURIComponent(JSON.stringify(ids));
      expect(cookieOwnsOffer(raw, 'offer-999')).toBe(false);
    });

    it('returns false when cookie is undefined', () => {
      expect(cookieOwnsOffer(undefined, 'offer-123')).toBe(false);
    });
  });
});
