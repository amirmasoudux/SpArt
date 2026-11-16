// SpArt's plan: the user picks the supermarkets they can go to. For every item on the list we look
// only at THOSE stores' Prospekte this week and pick the cheapest offer. Real data only:
//   - no catalog, no normal prices, no estimates: an item without an offer has no price,
//   - pack sizes are compared by the price per kg / per litre printed in the Prospekt,
//   - a saving is shown only when the Prospekt prints the old price ("statt").
import { findOffers } from './search';

type Chain = 'rewe' | 'lidl' | 'aldi' | 'kaufland' | 'penny' | 'netto';

export interface PickItem {
  id: string;
  name: string;
  qty: number;
  wordId: string | null;
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
  kind: 'offer' | 'none'; // none = no offer at the user's stores this week
  chain: Chain | null;
  title: string | null; // the product as the Prospekt calls it
  unitInfo: string | null;
  packPrice: number | null; // price of one pack
  price: number; // packPrice × qty (0 for none)
  saving: number; // (old price − offer price) × qty, 0 when the Prospekt prints no old price
  perUnit: { value: number; unit: 'kg' | 'l' } | null;
}

export interface PickResult {
  picks: Pick[];
  total: number; // all offers on the list
  saved: number;
  offerCount: number; // Prospekt offers of the user's stores this week
}

const round = (n: number) => Math.round(n * 100) / 100;

// "1 kg = 8.98" or "ab, 1 l = 1.73" → 8.98 per kg
export function perUnitFromInfo(info: string | null): { value: number; unit: 'kg' | 'l' } | null {
  const m = info?.match(/1\s*(kg|l)\s*=\s*(\d+(?:[.,]\d+)?)/i);
  return m ? { unit: m[1].toLowerCase() as 'kg' | 'l', value: Number(m[2].replace(',', '.')) } : null;
}

// A pack of more than 5 kg or 5 litres (a 12-litre milk crate, a 7.5 kg potato sack) is cheap per kg,
// but not what most people mean by "milk" or "potatoes". It goes after the normal packs.
const BIG_PACK = 5;
const isBig = (o: PickOffer) => {
  const u = perUnitFromInfo(o.unitInfo);
  return Boolean(u && o.price / u.value > BIG_PACK);
};

// Cheapest first: normal packs before big packs; by price per kg/l when the Prospekt prints it,
// then the others by pack price.
export function byValue(a: PickOffer, b: PickOffer): number {
  const ba = isBig(a);
  const bb = isBig(b);
  if (ba !== bb) return ba ? 1 : -1;
  const ua = perUnitFromInfo(a.unitInfo);
  const ub = perUnitFromInfo(b.unitInfo);
  if (ua && ub && ua.unit === ub.unit) return ua.value - ub.value;
  if (ua && !ub) return -1;
  if (!ua && ub) return 1;
  return a.price - b.price;
}

export function pickForStores(items: PickItem[], chains: Chain[], prospekt: PickOffer[]): PickResult {
  const mine = prospekt.filter((o) => chains.includes(o.chain));
  const picks: Pick[] = items.map((item) => {
    const best = findOffers(item.name, mine, 50, item.wordId).sort(byValue)[0];
    if (!best) {
      return { itemId: item.id, name: item.name, qty: item.qty, kind: 'none', chain: null, title: null, unitInfo: null, packPrice: null, price: 0, saving: 0, perUnit: null };
    }
    const saving = best.regularPrice && best.regularPrice > best.price ? best.regularPrice - best.price : 0;
    return {
      itemId: item.id,
      name: item.name,
      qty: item.qty,
      kind: 'offer',
      chain: best.chain,
      title: best.title,
      unitInfo: best.unitInfo,
      packPrice: best.price,
      price: round(best.price * item.qty),
      saving: round(saving * item.qty),
      perUnit: perUnitFromInfo(best.unitInfo),
    };
  });

  return {
    picks,
    total: round(picks.reduce((s, p) => s + p.price, 0)),
    saved: round(picks.reduce((s, p) => s + p.saving, 0)),
    offerCount: mine.length,
  };
}
