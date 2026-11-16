import { describe, expect, it } from 'vitest';
import { perUnitFromInfo, pickForStores } from '../src/lib/pick.js';

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

  it('no offer at the user’s stores → no price (no estimate)', () => {
    const r = pickForStores([butter, { id: 'x', name: 'Toffifee', qty: 1, wordId: null }], ['aldi'], prospekt);
    expect(r.picks.map((p) => p.kind)).toEqual(['none', 'none']);
    expect(r.total).toBe(0);
  });

  it('reads the price per kg / litre', () => {
    expect(perUnitFromInfo('ab, 1 l = 1.73')).toEqual({ value: 1.73, unit: 'l' });
    expect(perUnitFromInfo('ab')).toBeNull();
  });
});
