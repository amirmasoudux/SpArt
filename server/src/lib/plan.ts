// The core idea of SpArt: which store is cheapest for this list this week,
// using the offers from this week's Prospekte.
import type { Offer, PlanRequest, Product, Store } from '../schemas.js';

export interface PlanLine {
  itemId: string;
  productId: string;
  name: string;
  qty: number;
  price: number;
  saving: number;
  onOffer: boolean;
}

export interface StorePlan {
  store: Store;
  basketTotal: number;
  saved: number;
  lines: PlanLine[];
  noPriceCount: number;
}

const round = (n: number) => Math.round(n * 100) / 100;

export function planForStore(items: PlanRequest['items'], store: Store, products: Product[], offers: Offer[]): StorePlan {
  const lines: PlanLine[] = [];
  let noPriceCount = 0;

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    const regular = product?.prices[store.chain];
    if (!product || regular === undefined) {
      noPriceCount++;
      continue;
    }
    const offer = offers.find((o) => o.chain === store.chain && o.productId === product.id);
    const unitPrice = offer ? Math.min(offer.price, regular) : regular;
    lines.push({
      itemId: item.id,
      productId: product.id,
      name: `${product.name} ${product.unit}`,
      qty: item.qty,
      price: round(unitPrice * item.qty),
      saving: round((regular - unitPrice) * item.qty),
      onOffer: Boolean(offer),
    });
  }

  return {
    store,
    basketTotal: round(lines.reduce((s, l) => s + l.price, 0)),
    saved: round(lines.reduce((s, l) => s + l.saving, 0)),
    lines: lines.sort((a, b) => b.saving - a.saving),
    noPriceCount,
  };
}

// All stores, cheapest basket first.
export function rankStores(items: PlanRequest['items'], stores: Store[], products: Product[], offers: Offer[]): StorePlan[] {
  return stores.map((s) => planForStore(items, s, products, offers)).sort((a, b) => a.basketTotal - b.basketTotal);
}
