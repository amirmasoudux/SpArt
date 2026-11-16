import { describe, expect, it } from 'vitest';
import { loadDemoData } from '../src/repo.js';
import { findOffers, productMatches, titleMatches } from '../src/lib/search.js';
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

  it('finds the right product for our catalog items, not look-alikes', () => {
    expect(productMatches('Rinderhackfleisch', 'minced-beef-500g')).toBe(true);
    expect(productMatches('Frisches Rinder-Hackfleisch', 'minced-beef-500g')).toBe(true);
    expect(productMatches('Schweine-Hackfleisch', 'minced-beef-500g')).toBe(false); // pork
    expect(productMatches('Rinderrouladen', 'minced-beef-500g')).toBe(false);
    expect(productMatches('Dtsch. Speisekartoffeln', 'potatoes-2kg')).toBe(true);
    expect(productMatches('Kartoffel-Snacks', 'potatoes-2kg')).toBe(false); // crisps
    expect(productMatches('Marzipankartoffeln', 'potatoes-2kg')).toBe(false);
    expect(productMatches('Hähnchen-Keule', 'chicken-breast-600g')).toBe(false); // leg, not breast
    expect(productMatches('Frische Hähnchenbrustfilets', 'chicken-breast-600g')).toBe(true);
    expect(productMatches('Zahnpasta', 'pasta-500g')).toBe(false);
    expect(productMatches('Granatapfel', 'apples-1kg')).toBe(false);
  });
});
