import { describe, expect, it } from 'vitest';
import { loadData } from '../src/repo.js';
import { findOffers, titleMatches, wordMatches } from '../src/lib/search.js';
import { findWord } from '../src/lib/words.js';

const { prospekt } = loadData();

describe('Prospekt search', () => {
  it('loads all Prospekt offers', () => {
    expect(prospekt.length).toBeGreaterThan(400);
    expect(new Set(prospekt.map((o) => o.chain)).size).toBe(6);
  });

  it('finds anything by name, cheapest first', () => {
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

  it('search words find the right thing, not look-alikes', () => {
    expect(wordMatches('Rinderhackfleisch', 'minced-beef')).toBe(true);
    expect(wordMatches('Frisches Rinder-Hackfleisch', 'minced-beef')).toBe(true);
    expect(wordMatches('Schweine-Hackfleisch', 'minced-beef')).toBe(false); // pork
    expect(wordMatches('Rinderrouladen', 'minced-beef')).toBe(false);
    expect(wordMatches('Dtsch. Speisekartoffeln', 'potatoes')).toBe(true);
    expect(wordMatches('Kartoffel-Snacks', 'potatoes')).toBe(false); // crisps
    expect(wordMatches('Marzipankartoffeln', 'potatoes')).toBe(false);
    expect(wordMatches('Hähnchen-Keule', 'chicken-breast')).toBe(false); // leg, not breast
    expect(wordMatches('Frische Hähnchenbrustfilets', 'chicken-breast')).toBe(true);
    expect(wordMatches('Zahnpasta', 'pasta')).toBe(false);
    expect(wordMatches('Granatapfel', 'apples')).toBe(false);
  });

  it('understands English and German list words', () => {
    expect(findWord('2 minced beef')?.id).toBe('minced-beef');
    expect(findWord('Hackfleisch')?.id).toBe('minced-beef');
    expect(findWord('canned tomatoes')?.id).toBe('canned-tomatoes'); // longest first, not "tomatoes"
    expect(findWord('Toffifee')).toBeUndefined();
  });
});
