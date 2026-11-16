import { describe, expect, it } from 'vitest';
import { packSize, perUnitFromInfo, pickForStores } from '../src/lib/pick.js';
import { loadDemoData } from '../src/repo.js';

const { products } = loadDemoData();
// Test offers (not app data), so the numbers don't change with each week's Prospekte.
const prospekt = [
  { chain: 'kaufland' as const, title: 'Butter', price: 1.49, regularPrice: 1.99, unitInfo: '1 kg = 5.96' },
  { chain: 'lidl' as const, title: 'Butter', price: 1.29, regularPrice: null, unitInfo: '1 kg = 5.16' },
  { chain: 'aldi' as const, title: 'H-Vollmilch 12 x 1 l', price: 8.4, regularPrice: null, unitInfo: '1 l = 0.70' },
  { chain: 'aldi' as const, title: 'Frische Milch 1 l', price: 0.99, regularPrice: null, unitInfo: '1 l = 0.99' },
];
const butter = { id: 'b', name: 'Butter', qty: 2, productId: 'butter-250g' };
const milk = { id: 'm', name: 'Milk', qty: 1, productId: 'milk-1l' };

describe('pickForStores', () => {
  it('only looks at the user’s supermarkets and uses the old price from the Prospekt', () => {
    const r = pickForStores([butter], ['kaufland'], products, prospekt);
    expect(r.picks[0]).toMatchObject({ kind: 'offer', chain: 'kaufland', price: 2.98, saving: 1 });
    expect(r.offerCount).toBe(1);
  });

  it('uses offers only: REWE without an offer is not on the plan', () => {
    const r = pickForStores([butter], ['rewe', 'lidl'], products, prospekt);
    expect(r.picks[0]).toMatchObject({ kind: 'offer', chain: 'lidl', price: 2.58, saving: 0 }); // no old price printed → no saving
    expect(pickForStores([butter], ['rewe'], products, prospekt).picks[0].kind).toBe('none');
  });

  it('does not pick a 12-litre crate for 1 litre of milk', () => {
    const r = pickForStores([milk], ['aldi'], products, prospekt);
    expect(r.picks[0].title).toBe('Frische Milch 1 l');
  });

  it('says "none" when the user’s stores have nothing for the item', () => {
    const r = pickForStores([{ id: 'x', name: 'Toffifee', qty: 1, productId: null }], ['lidl'], products, prospekt);
    expect(r.picks[0].kind).toBe('none');
    expect(r.total).toBe(0);
  });

  it('reads sizes and prices per kg / litre', () => {
    expect(packSize('500 g')).toEqual({ amount: 0.5, unit: 'kg' });
    expect(packSize('750 ml')).toEqual({ amount: 0.75, unit: 'l' });
    expect(packSize('8 rolls')).toBeNull();
    expect(perUnitFromInfo('ab, 1 l = 1.73')).toEqual({ value: 1.73, unit: 'l' });
  });
});
