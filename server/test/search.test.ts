import { describe, expect, it } from 'vitest';
import { loadDemoData } from '../src/repo.js';
import { findOffers, titleMatches } from '../src/lib/search.js';

const { prospekt } = loadDemoData(new Date('2026-11-11T12:00:00'), { imported: false });

describe('Prospekt search', () => {
  it('loads all Prospekt offers', () => {
    expect(prospekt.length).toBeGreaterThan(400);
    expect(new Set(prospekt.map((o) => o.chain)).size).toBe(6);
  });

  it('finds things outside the catalog, cheapest first', () => {
    const toffifee = findOffers('Toffifee', prospekt);
    expect(toffifee.map((o) => o.chain).sort()).toEqual(['kaufland', 'netto', 'penny']);
    expect(toffifee[0].price).toBeLessThanOrEqual(toffifee[1].price);
  });

  it('understands English words and German compound words', () => {
    expect(findOffers('chocolate', prospekt).length).toBeGreaterThan(0);
    expect(findOffers('lachs', prospekt).some((o) => /räucherlachs/i.test(o.title))).toBe(true);
  });

  it('does not mix up look-alike words', () => {
    expect(titleMatches('Lauchzwiebeln', ['zwiebeln'])).toBe(false);
    expect(titleMatches('Speisezwiebeln gelb', ['zwiebeln'])).toBe(true);
    expect(titleMatches('Milchreis', ['reis'])).toBe(false);
  });
});
