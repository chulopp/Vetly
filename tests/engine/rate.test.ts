import { describe, expect, it } from 'vitest';
import {
  adjustedHours,
  effectiveHourlyRate,
  netBudget,
  profitabilityMargin,
  revisionPenaltyHours,
  round2,
} from '@/lib/engine/rate';

describe('round2', () => {
  it('rounds to exactly 2 decimals deterministically', () => {
    expect(round2(58.78787878787879)).toBe(58.79);
    expect(round2(11.637931034482758)).toBe(11.64);
    expect(round2(260.8695652173913)).toBe(260.87);
    expect(round2(17.58)).toBe(17.58);
    expect(round2(-61.199999999999996)).toBe(-61.2);
    expect(round2(0)).toBe(0);
  });
});

describe('revisionPenaltyHours (PRD 3.2 A)', () => {
  it('0–2 revisions cost no additional hours', () => {
    expect(revisionPenaltyHours(0, [])).toBe(0);
    expect(revisionPenaltyHours(1, [])).toBe(0);
    expect(revisionPenaltyHours(2, [])).toBe(0);
  });

  it('>2 revisions cost +5% per revision beyond 2', () => {
    expect(revisionPenaltyHours(3, [])).toBe(0.05);
    expect(revisionPenaltyHours(4, [])).toBeCloseTo(0.1, 12);
    expect(revisionPenaltyHours(5, [])).toBeCloseTo(0.15, 12);
    expect(revisionPenaltyHours(10, [])).toBeCloseTo(0.4, 12);
  });

  it('unlimited_revisions locks the penalty at a flat +35%, overriding the per-revision formula', () => {
    expect(revisionPenaltyHours(2, ['unlimited_revisions'])).toBe(0.35);
    expect(revisionPenaltyHours(7, ['unlimited_revisions'])).toBe(0.35);
  });
});

describe('netBudget', () => {
  it('applies the platform fee', () => {
    expect(netBudget(8000, 0)).toBe(8000);
    expect(netBudget(8000, 3)).toBeCloseTo(7760, 9);
    expect(netBudget(1500, 10)).toBeCloseTo(1350, 9);
    expect(netBudget(100, 99.99)).toBeCloseTo(0.01, 9);
  });
});

describe('adjustedHours', () => {
  it('applies the fixed +10% overhead plus the revision penalty', () => {
    expect(adjustedHours(120, 0)).toBeCloseTo(132, 9);
    expect(adjustedHours(80, 0.35)).toBeCloseTo(116, 9);
    expect(adjustedHours(60, 0.05)).toBeCloseTo(69, 9);
  });
});

describe('effectiveHourlyRate', () => {
  it('rounds net budget over adjusted hours to 2 decimals', () => {
    expect(effectiveHourlyRate(8000 * 0.97, 120 * 1.1)).toBe(58.79);
    expect(effectiveHourlyRate(1500 * 0.9, 80 * 1.45)).toBe(11.64);
    expect(effectiveHourlyRate(18000, 60 * 1.15)).toBe(260.87);
  });
});

describe('profitabilityMargin', () => {
  it('computes the margin from the already-rounded effective rate', () => {
    expect(profitabilityMargin(58.79, 50)).toBe(17.58);
    expect(profitabilityMargin(11.64, 30)).toBe(-61.2);
    expect(profitabilityMargin(50, 50)).toBe(0);
  });
});
