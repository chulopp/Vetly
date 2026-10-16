import { describe, expect, it } from 'vitest';
import {
  depositPoints,
  flagPoints,
  paymentTermsPoints,
  riskContributions,
  riskScore,
  riskTier,
  tierProximity,
} from '@/lib/engine/risk';
import type { RiskInput } from '@/lib/engine/risk';

const riskInput = (partial: Partial<RiskInput>): RiskInput => ({
  depositPercent: 50,
  paymentTermsDays: 7,
  flags: [],
  ...partial,
});

describe('depositPoints (PRD 3.2 B — precise intervals)', () => {
  it('assigns points per the exact brackets', () => {
    expect(depositPoints(50)).toBe(0);
    expect(depositPoints(75)).toBe(0);
    expect(depositPoints(100)).toBe(0);
    expect(depositPoints(49.99)).toBe(10);
    expect(depositPoints(25)).toBe(10);
    expect(depositPoints(49)).toBe(10);
    expect(depositPoints(24.99)).toBe(20);
    expect(depositPoints(0.01)).toBe(20);
    expect(depositPoints(0)).toBe(30);
  });
});

describe('paymentTermsPoints (PRD 3.2 B)', () => {
  it('assigns points per the exact day brackets', () => {
    expect(paymentTermsPoints(0)).toBe(0);
    expect(paymentTermsPoints(3)).toBe(0);
    expect(paymentTermsPoints(7)).toBe(0);
    expect(paymentTermsPoints(7.5)).toBe(10); // fractional input resolves deterministically
    expect(paymentTermsPoints(8)).toBe(10);
    expect(paymentTermsPoints(15)).toBe(10);
    expect(paymentTermsPoints(30)).toBe(10);
    expect(paymentTermsPoints(31)).toBe(20);
    expect(paymentTermsPoints(45)).toBe(20);
    expect(paymentTermsPoints(60)).toBe(20);
    expect(paymentTermsPoints(60.5)).toBe(35);
    expect(paymentTermsPoints(61)).toBe(35);
    expect(paymentTermsPoints(90)).toBe(35);
    expect(paymentTermsPoints(365)).toBe(35);
  });
});

describe('flagPoints', () => {
  it('assigns the PRD weights', () => {
    expect(flagPoints('no_contract')).toBe(25);
    expect(flagPoints('vague_scope')).toBe(20);
    expect(flagPoints('unlimited_revisions')).toBe(15);
    expect(flagPoints('first_time_client')).toBe(10);
  });
});

describe('riskContributions', () => {
  it('returns deposit and payment terms contributions first, then active flags in canonical order', () => {
    const contributions = riskContributions(
      riskInput({ depositPercent: 0, paymentTermsDays: 90, flags: ['no_contract', 'vague_scope', 'unlimited_revisions', 'first_time_client'] }),
    );
    expect(contributions).toHaveLength(6);
    expect(contributions.map((c) => c.source)).toEqual([
      'deposit',
      'paymentTerms',
      'flag:no_contract',
      'flag:vague_scope',
      'flag:unlimited_revisions',
      'flag:first_time_client',
    ]);
    expect(contributions.map((c) => c.points)).toEqual([30, 35, 25, 20, 15, 10]);
  });

  it('labels and details are stable strings', () => {
    const contributions = riskContributions(riskInput({ depositPercent: 25, paymentTermsDays: 30 }));
    expect(contributions[0].label).toBe('Upfront deposit');
    expect(contributions[0].detail).toBe('25% upfront');
    expect(contributions[1].label).toBe('Payment terms');
    expect(contributions[1].detail).toBe('Net 30 days');
  });

  it('a zero deposit reads as no upfront deposit; zero terms read as due upfront', () => {
    const contributions = riskContributions(riskInput({ depositPercent: 0, paymentTermsDays: 0 }));
    expect(contributions[0].detail).toBe('No upfront deposit');
    expect(contributions[1].detail).toBe('Due upfront (net 0)');
  });
});

describe('riskScore (guard: never exceeds 100)', () => {
  it('sums contributions additively', () => {
    const contributions = riskContributions(riskInput({ depositPercent: 0, paymentTermsDays: 90, flags: ['no_contract'] }));
    expect(riskScore(contributions)).toBe(90); // 30 + 35 + 25
  });

  it('caps the raw score at 100 with all risk factors maxed (no overflow)', () => {
    const contributions = riskContributions(
      riskInput({ depositPercent: 0, paymentTermsDays: 90, flags: ['no_contract', 'vague_scope', 'unlimited_revisions', 'first_time_client'] }),
    );
    expect(riskScore(contributions)).toBe(100); // raw 135 -> min(100, 135)
  });
});

describe('riskTier (exact boundaries: 30/31, 60/61)', () => {
  it('assigns tiers at the exact PRD boundaries', () => {
    expect(riskTier(0)).toBe('LOW');
    expect(riskTier(30)).toBe('LOW');
    expect(riskTier(31)).toBe('MEDIUM');
    expect(riskTier(60)).toBe('MEDIUM');
    expect(riskTier(61)).toBe('HIGH');
    expect(riskTier(100)).toBe('HIGH');
  });
});

describe('tierProximity (boundary-proximity display)', () => {
  it('a 29/100 (LOW) reads as 2 points from MEDIUM, not the same confidence as 5/100', () => {
    expect(tierProximity(29)).toEqual({ nextTier: 'MEDIUM', points: 2, message: '2 points from MEDIUM' });
    expect(tierProximity(5)).toEqual({ nextTier: 'MEDIUM', points: 26, message: '26 points from MEDIUM' });
  });

  it('handles singular and boundary values', () => {
    expect(tierProximity(30)).toEqual({ nextTier: 'MEDIUM', points: 1, message: '1 point from MEDIUM' });
    expect(tierProximity(31)).toEqual({ nextTier: 'HIGH', points: 30, message: '30 points from HIGH' });
    expect(tierProximity(60)).toEqual({ nextTier: 'HIGH', points: 1, message: '1 point from HIGH' });
  });

  it('HIGH has no next tier; shows distance to the cap', () => {
    expect(tierProximity(61)).toEqual({ nextTier: null, points: 39, message: '39 points below the maximum (100)' });
    expect(tierProximity(100)).toEqual({ nextTier: null, points: 0, message: 'At the maximum risk score (100)' });
  });
});
