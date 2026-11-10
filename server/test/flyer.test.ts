import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseAmount, priceForProductSize, toOffers } from '../src/lib/flyer.js';
import { matchProduct } from '../src/lib/match.js';
import { loadDemoData } from '../src/repo.js';

const { products } = loadDemoData();
const week = { from: new Date('2026-11-16T00:00:00'), to: new Date('2026-11-21T23:59:59') };

describe('Prospekt import', () => {
  it('reads amounts from flyer units', () => {
    expect(parseAmount('1,5 kg')).toEqual({ value: 1500, base: 'g' });
    expect(parseAmount('je 500-g-Packung')).toEqual({ value: 500, base: 'g' });
    expect(parseAmount('1 l')).toEqual({ value: 1000, base: 'ml' });
    expect(parseAmount('Stück')).toBeNull();
  });

  it('scales a price to our product size', () => {
    expect(priceForProductSize(1.99, '200 g', '400 g')).toBe(3.98);
    expect(priceForProductSize(0.99, null, '1 L')).toBe(0.99);
  });

  it('matches German flyer names to products', () => {
    expect(matchProduct('Weihenstephan H-Milch 1,5%', products)?.id).toBe('milk-1l');
    expect(matchProduct('Rispentomaten', products)?.id).toBe('tomatoes-500g');
    expect(matchProduct('Lachsfilet', products)).toBeUndefined();
    // Real mistakes found in the REWE and Lidl import of 9.11.2026:
    expect(matchProduct('Lauchzwiebeln', products)).toBeUndefined();
    expect(matchProduct('Milchreis', products)).toBeUndefined();
    expect(matchProduct('Haltbare Vollmilch', products)?.id).toBe('milk-1l');
  });

  it('turns the sample AI answer into offers', () => {
    const raw = JSON.parse(readFileSync(new URL('../scripts/sample-flyer-answer.json', import.meta.url), 'utf8')).offers;
    const result = toOffers(raw, 'rewe', products, week, 'test');
    const ids = result.offers.map((o) => o.productId).sort();
    expect(ids).toEqual(['bananas-1kg', 'coffee-500g', 'dish-soap', 'gouda-400g', 'milk-1l', 'tomatoes-500g'].sort());
    // Spaghetti 1.19 is NOT cheaper than our normal pasta price 0.99, so it is dropped.
    expect(ids).not.toContain('pasta-500g');
    expect(result.offers.find((o) => o.productId === 'gouda-400g')?.price).toBe(2.29); // 200 g slices scaled up, so not cheaper
    expect(result.unmatched.map((u) => u.product)).toEqual(['Lachsfilet']);
    expect(result.invalid).toBe(1); // "2,99" is text, not a number
  });
});
