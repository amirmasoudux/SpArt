import { describe, expect, it } from 'vitest';
import { perUnitFromInfo, pickForStores, planPerStore } from '../src/lib/pick.js';

// Test offers (not app data), so the numbers don't change with each week's Prospekte.
const prospekt = [
  { chain: 'kaufland' as const, title: 'Markenbutter', price: 1.49, regularPrice: 1.99, unitInfo: '1 kg = 5.96' },
  { chain: 'lidl' as const, title: 'Butter', price: 1.29, regularPrice: null, unitInfo: '1 kg = 5.16' },
  { chain: 'aldi' as const, title: 'H-Vollmilch 12 x 1 l', price: 8.4, regularPrice: null, unitInfo: '1 l = 0.70' },
  { chain: 'aldi' as const, title: 'Frische Vollmilch 1 l', price: 0.99, regularPrice: null, unitInfo: '1 l = 0.99' },
];
const butter = { id: 'b', name: 'Butter', qty: 2, wordId: 'butter' };
const milk = { id: 'm', name: 'Milk', qty: 1, wordId: 'milk' };

describe('pickForStores', () => {
  it('only looks at the user’s supermarkets and uses the old price from the Prospekt', () => {
    const r = pickForStores([butter], ['kaufland'], prospekt);
    expect(r.picks[0]).toMatchObject({ kind: 'offer', chain: 'kaufland', price: 2.98, saving: 1 });
    expect(r.offerCount).toBe(1);
  });

  it('takes the cheapest offer per kg; no old price printed → no saving', () => {
    const r = pickForStores([butter], ['kaufland', 'lidl'], prospekt);
    expect(r.picks[0]).toMatchObject({ kind: 'offer', chain: 'lidl', price: 2.58, saving: 0 });
  });

  it('does not pick a 12-litre crate for milk', () => {
    expect(pickForStores([milk], ['aldi'], prospekt).picks[0].title).toBe('Frische Vollmilch 1 l');
  });

  it('says when the only offer is a big pack', () => {
    const crate = prospekt.filter((o) => o.title.startsWith('H-Vollmilch'));
    expect(pickForStores([milk], ['aldi'], crate).picks[0].bigPack).toBe('12 l');
    expect(pickForStores([milk], ['aldi'], prospekt).picks[0].bigPack).toBeNull();
  });

  it('no offer at the user’s stores → no price (no estimate)', () => {
    const r = pickForStores([butter, { id: 'x', name: 'Toffifee', qty: 1, wordId: null }], ['aldi'], prospekt);
    expect(r.picks.map((p) => p.kind)).toEqual(['none', 'none']);
    expect(r.total).toBe(0);
  });

  it('one plan per supermarket, the one with the most offers first', () => {
    const r = planPerStore([butter, milk], ['aldi', 'kaufland', 'lidl'], prospekt);
    expect(r.stores[0].onOffer).toBe(1);
    expect(r.stores.map((s) => s.chain)).toEqual(['kaufland', 'aldi', 'lidl']); // same count: the bigger saving first (Kaufland €1.00), then the lower total (ALDI €0.99)
    expect(r.stores.every((s) => s.picks.every((p) => p.chain === null || p.chain === s.chain))).toBe(true);
  });

  it('finds the search word for lists saved without one ("Milk" is not chocolate)', () => {
    const choc = { chain: 'rewe' as const, title: 'Alpenmilch Schokolade', price: 1.29, regularPrice: null, unitInfo: null };
    expect(pickForStores([{ id: 'm', name: 'Milk', qty: 1, wordId: null }], ['rewe'], [choc]).picks[0].kind).toBe('none');
  });

  it('uses the normal price when there is no offer, and the cheaper of the two per kg', () => {
    const normal = [
      { wordId: 'butter', chain: 'aldi' as const, price: 1.15, size: '250 g', title: 'Markenbutter', source: 'ALDI SÜD website', date: '2026-11-18' },
      { wordId: 'butter', chain: 'kaufland' as const, price: 1.19, size: '250 g', title: 'Butter', source: 'Open Prices', date: '2026-09-22' },
      { wordId: 'milk', chain: 'aldi' as const, price: 0.85, size: '1 l', title: 'H-Milch', source: 'ALDI SÜD website', date: '2026-11-18' },
    ];
    const aldi = pickForStores([butter, milk], ['aldi'], prospekt, normal).picks;
    expect(aldi[0]).toMatchObject({ kind: 'normal', price: 2.3, normal: { source: 'ALDI SÜD website' } });
    expect(aldi[1]).toMatchObject({ kind: 'normal', title: 'H-Milch' }); // 0.85 per litre beats 0.99, and the crate is too big
    // Kaufland: offer 1.49 (5.96/kg) is dearer than the normal 1.19 (4.76/kg)
    expect(pickForStores([butter], ['kaufland'], prospekt, normal).picks[0]).toMatchObject({ kind: 'normal', packPrice: 1.19 });
  });

  it('compares the whole basket only on items every store has a price for', () => {
    const normal = [{ wordId: 'milk', chain: 'kaufland' as const, price: 0.9, size: '1 l', title: 'Milch', source: 'Open Prices', date: '2026-08-11' }];
    const r = planPerStore([butter, milk], ['kaufland', 'aldi'], prospekt, normal);
    expect(r.compared).toEqual(['m']); // ALDI has no butter price → butter is left out
    expect(r.stores.map((s) => [s.chain, s.basket])).toEqual([['kaufland', 0.9], ['aldi', 0.99]]);
  });

  it('reads the price per kg / litre', () => {
    expect(perUnitFromInfo('ab, 1 l = 1.73')).toEqual({ value: 1.73, unit: 'l' });
    expect(perUnitFromInfo('ab')).toBeNull();
  });
});
