// The core idea of SpArt: which store is best for this list this week,
// based on the offers in this week's Prospekte.
//
// MVP: we don't know where the user lives, so we compare prices only.
// Later, with a postcode, we can add the trip cost to each store.

import type { ListItem, Offer, Product, Store } from '../types';

export interface PlanLine {
  itemId: string;
  name: string;
  qty: number;
  price: number; // what you pay for this line
  saving: number; // Prospekt saving for this line (0 if no offer)
  onOffer: boolean;
}

export interface StorePlan {
  store: Store;
  basketTotal: number;
  saved: number; // money saved through offers
  lines: PlanLine[];
  noPriceCount: number; // items we have no price for
}

export function planForStore(items: ListItem[], store: Store, products: Product[], offers: Offer[]): StorePlan {
  const lines: PlanLine[] = [];
  let noPriceCount = 0;

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      noPriceCount++;
      continue;
    }
    const regular = product.prices[store.chain];
    const offer = offers.find((o) => o.chain === store.chain && o.productId === product.id);
    const unitPrice = offer ? offer.price : regular;
    lines.push({
      itemId: item.id,
      name: `${product.name} ${product.unit}`,
      qty: item.qty,
      price: unitPrice * item.qty,
      saving: offer ? (regular - offer.price) * item.qty : 0,
      onOffer: Boolean(offer),
    });
  }

  return {
    store,
    basketTotal: lines.reduce((sum, l) => sum + l.price, 0),
    saved: lines.reduce((sum, l) => sum + l.saving, 0),
    lines: lines.sort((a, b) => b.saving - a.saving),
    noPriceCount,
  };
}

// All stores, cheapest basket first.
export function rankStores(items: ListItem[], stores: Store[], products: Product[], offers: Offer[]): StorePlan[] {
  return stores.map((s) => planForStore(items, s, products, offers)).sort((a, b) => a.basketTotal - b.basketTotal);
}

export function euro(n: number): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(n);
}
