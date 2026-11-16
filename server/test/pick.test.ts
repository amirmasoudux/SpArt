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

  it('takes REWE’s normal price when it is cheaper per kg than every offer', () => {
    // REWE butter 250 g = 1.15 → 4.60 per kg, cheaper than 5.96 at Kaufland
    const r = pickForStores([butter], ['rewe', 'kaufland'], products, prospekt);
    expect(r.picks[0]).toMatchObject({ kind: 'normal', chain: 'rewe', price: 2.3, saving: 0 });
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
