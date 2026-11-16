// SpArt's plan: the user picks the supermarkets near them. For every item on the list we look
// only at THOSE stores' Prospekte and pick the cheapest offer. Real data only:
//   - no normal prices, no estimates; an item without an offer simply has no price,
//   - different pack sizes are compared by the price per kg / per litre printed in the Prospekt,
//   - a saving is shown only when the Prospekt prints the old price ("statt").
import { findOffers } from './search.js';

type Chain = 'rewe' | 'lidl' | 'aldi' | 'kaufland' | 'penny' | 'netto';

export interface PickItem {
  id: string;
  name: string;
  qty: number;
  productId: string | null;
}
export interface PickProduct {
  id: string;
  name: string;
  unit: string; // only to know the size the user wants (no prices)
}
export interface PickOffer {
  chain: Chain;
  title: string;
  price: number;
  regularPrice: number | null;
  unitInfo: string | null;
}

export interface Pick {
  itemId: string;
  name: string; // what the user wrote
  qty: number;
  productId: string | null;
  kind: 'offer' | 'none'; // none = no offer at the user's stores this week
  chain: Chain | null;
  title: string | null; // the product as the store calls it
  unitInfo: string | null;
  packPrice: number | null; // price of one pack
  price: number; // packPrice × qty (0 for none)
  saving: number; // real saving for the line, 0 when we don't know it
  perUnit: { value: number; unit: 'kg' | 'l' } | null;
  others: { chain: Chain; title: string; price: number; regularPrice: number | null; unitInfo: string | null }[]; // other offers at the user's stores
}

export interface PickResult {
  picks: Pick[];
  total: number;
  saved: number;
  offerCount: number; // Prospekt offers of the user's stores this week
}

const round = (n: number) => Math.round(n * 100) / 100;

// "1 kg = 8.98" or "ab, 1 l = 1.73" → 8.98 per kg
export function perUnitFromInfo(info: string | null): { value: number; unit: 'kg' | 'l' } | null {
  const m = info?.match(/1\s*(kg|l)\s*=\s*(\d+(?:[.,]\d+)?)/i);
  return m ? { unit: m[1].toLowerCase() as 'kg' | 'l', value: Number(m[2].replace(',', '.')) } : null;
}

// "500 g" → 0.5 kg, "1 L" → 1 l, "750 ml" → 0.75 l. Pieces, rolls etc. → null
export function packSize(unit: string): { amount: number; unit: 'kg' | 'l' } | null {
  const m = unit.trim().match(/^(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l)$/i);
  if (!m) return null;
  const n = Number(m[1].replace(',', '.'));
  const u = m[2].toLowerCase();
  if (u === 'g') return { amount: n / 1000, unit: 'kg' };
  if (u === 'kg') return { amount: n, unit: 'kg' };
  if (u === 'ml') return { amount: n / 1000, unit: 'l' };
  return { amount: n, unit: 'l' };
}

// Cheapest first: by price per kg/l when we know it, the others after them by pack price.
// A big pack (a 12-litre crate when the list says 1 litre of milk) goes to the end:
// cheap per litre, but not what the user asked for.
function byValue(needed: { amount: number; unit: 'kg' | 'l' } | null) {
  const big = (o: PickOffer) => {
    const u = perUnitFromInfo(o.unitInfo);
    return Boolean(needed && u && u.unit === needed.unit && o.price / u.value > needed.amount * 2.5);
  };
  return (a: PickOffer, b: PickOffer): number => {
    const ba = big(a);
    const bb = big(b);
    if (ba !== bb) return ba ? 1 : -1;
    const ua = perUnitFromInfo(a.unitInfo);
    const ub = perUnitFromInfo(b.unitInfo);
    if (ua && ub && ua.unit === ub.unit) return ua.value - ub.value;
    if (ua && !ub) return -1;
    if (!ua && ub) return 1;
    return a.price - b.price;
  };
}

export function pickForStores(
  items: PickItem[],
  chains: Chain[],
  products: PickProduct[],
  prospekt: PickOffer[],
  aliases: Record<string, string[]> = {},
): PickResult {
  const mine = prospekt.filter((o) => chains.includes(o.chain));
  const picks: Pick[] = items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    const extra = item.productId ? aliases[item.productId] ?? [] : [];
    const size = product ? packSize(product.unit) : null;
    const needed = size ? { amount: size.amount * item.qty, unit: size.unit } : null;
    const offers = findOffers(item.name, mine, extra, 50, item.productId).sort(byValue(needed));
    const best = offers[0];

    if (!best) {
      return { itemId: item.id, name: item.name, qty: item.qty, productId: item.productId, kind: 'none', chain: null, title: null, unitInfo: null, packPrice: null, price: 0, saving: 0, perUnit: null, others: [] };
    }

    // The saving: only when the Prospekt prints the old price ("statt").
    const saving = best.regularPrice && best.regularPrice > best.price ? best.regularPrice - best.price : 0;

    return {
      itemId: item.id,
      name: item.name,
      qty: item.qty,
      productId: item.productId,
      kind: 'offer',
      chain: best.chain,
      title: best.title,
      unitInfo: best.unitInfo,
      packPrice: best.price,
      price: round(best.price * item.qty),
      saving: round(saving * item.qty),
      perUnit: perUnitFromInfo(best.unitInfo),
      others: offers.slice(1, 4),
    };
  });

  return {
    picks,
    total: round(picks.reduce((s, p) => s + p.price, 0)),
    saved: round(picks.reduce((s, p) => s + p.saving, 0)),
    offerCount: mine.length,
  };
}
