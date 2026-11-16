import { describe, expect, it } from 'vitest';
import { loadDemoData } from '../src/repo.js';
import { findOffers, titleMatches } from '../src/lib/search.js';
import { PROSPEKT_WEEK } from '../src/lib/prospekt.js';

// A day inside the current Prospekt week, so the test keeps working after each weekly update.
const { prospekt } = loadDemoData(new Date(`${PROSPEKT_WEEK.rewe.from}T12:00:00`), { imported: false });

describe('Prospekt search', () => {
  it('loads all Prospekt offers', () => {
    expect(prospekt.length).toBeGreaterThan(400);
    expect(new Set(prospekt.map((o) => o.chain)).size).toBe(6);
  });

  it('finds things outside the catalog, cheapest first', () => {
    const bananas = findOffers('bananas', prospekt);
    expect(new Set(bananas.map((o) => o.chain)).size).toBeGreaterThan(1);
    expect(bananas[0].price).toBeLessThanOrEqual(bananas[1].price);
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
