import { describe, expect, it } from 'vitest';
import { rankStores } from '../src/lib/plan.js';
import { loadDemoData } from '../src/repo.js';

const data = loadDemoData(new Date('2026-11-11T12:00:00'), { imported: false }); // a Wednesday, demo offers only

describe('rankStores', () => {
  it('puts the cheapest basket first and counts the offer saving', () => {
    const items = [
      { id: 'a', name: 'Milk', qty: 2, productId: 'milk-1l' },
      { id: 'b', name: 'Gouda', qty: 1, productId: 'gouda-400g' },
    ];
    const plans = rankStores(items, data.stores, data.products, data.offers);
    expect(plans[0].basketTotal).toBeLessThanOrEqual(plans[1].basketTotal);
    const rewe = plans.find((p) => p.store.chain === 'rewe')!;
    // REWE: milk on offer 0.69 (regular 0.85), gouda no offer (2.45)
    expect(rewe.basketTotal).toBe(3.83);
    expect(rewe.saved).toBe(0.32);
  });

  it('counts items without a product as "no price"', () => {
    const plans = rankStores([{ id: 'x', name: 'Dragon fruit', qty: 1, productId: null }], data.stores, data.products, data.offers);
    expect(plans[0].noPriceCount).toBe(1);
    expect(plans[0].basketTotal).toBe(0);
  });
});
