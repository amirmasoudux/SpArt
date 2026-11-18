// SpArt's plan: the user picks the supermarkets they can go to. For every item and every one of
// those stores we take a real price:
//   1. this week's Prospekt offer of that store, or
//   2. the store's normal price (data/prices.json: ALDI SÜD website, REWE online shop, Open Prices)
//      when there is no offer, or when the normal price is cheaper than the offer (e.g. a 12-litre crate).
// No estimates: without an offer and without a normal price the item has no price in that store.
// The stores are compared on the whole basket: the items that have a price in every chosen store.
// A saving is shown only when the Prospekt prints the old price ("statt").
import { findOffers } from './search.js';
import { findWord } from './words.js';

type Chain = 'rewe' | 'lidl' | 'aldi' | 'kaufland' | 'penny' | 'netto';

export interface PickItem {
  id: string;
  name: string;
  qty: number;
  wordId: string | null;
}
export interface PickNormal {
  wordId: string;
  chain: Chain;
  price: number;
  size: string;
  title: string;
  source: string;
  date: string;
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
  kind: 'offer' | 'normal' | 'none'; // normal = normal price (no offer this week); none = no price at all
  chain: Chain | null;
  title: string | null; // the product as the Prospekt calls it
  unitInfo: string | null;
  packPrice: number | null; // price of one pack
  price: number; // packPrice × qty (0 for none)
  saving: number; // (old price − offer price) × qty, 0 when the Prospekt prints no old price
  perUnit: { value: number; unit: 'kg' | 'l' } | null;
  bigPack: string | null; // "12 l" when the only offer is a big pack (worked out from the Prospekt's price per kg/l)
  normal: { size: string; source: string; date: string } | null; // where a normal price comes from
  amount: { value: number; unit: 'kg' | 'l' } | null; // pack size, when we know it (to compare the same amount)
  per100g?: boolean; // the Prospekt price is for 100 g (fresh meat and fish)
}

// Fresh meat and fish: Prospekte often print the price for 100 g without saying so.
const PER_100G = ['chicken-breast', 'minced-beef', 'salmon'];
const NOT_COMPARED = ['detergent', 'beer', 'toilet-paper'];

// Pack size of an offer: from the Prospekt's price per kg/l, or 100 g for unsized fresh meat and fish.
function offerAmountOf(o: PickOffer, wordId: string | null): { value: number; unit: 'kg' | 'l' } | null {
  const u = perUnitFromInfo(o.unitInfo);
  if (u) return { value: o.price / u.value, unit: u.unit };
  if (wordId && PER_100G.includes(wordId) && o.price < 3) return { value: 0.1, unit: 'kg' };
  return null;
}

export interface PickResult {
  picks: Pick[];
  total: number; // all priced items on the list (offers and normal prices)
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

// "500 g" → 0.5 kg, "1.5 l" → 1.5 l, "1 kg" → 1 kg. "pack", "10 eggs" → null
export function amountOf(size: string): { value: number; unit: 'kg' | 'l' } | null {
  const m = size.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l)\b/i);
  if (!m) return null;
  const n = Number(m[1].replace(',', '.'));
  const u = m[2].toLowerCase();
  return u === 'g' ? { value: n / 1000, unit: 'kg' } : u === 'ml' ? { value: n / 1000, unit: 'l' } : { value: n, unit: u as 'kg' | 'l' };
}

// 8.88 at "1 l = 0.74" → "12 l"
function packAmount(o: PickOffer): string | null {
  const u = perUnitFromInfo(o.unitInfo);
  return u ? `${Math.round(o.price / u.value)} ${u.unit}` : null;
}

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

export function pickForStores(items: PickItem[], chains: Chain[], prospekt: PickOffer[], normal: PickNormal[] = []): PickResult {
  const mine = prospekt.filter((o) => chains.includes(o.chain));
  const picks: Pick[] = items.map((item) => {
    // Lists saved before the search words existed have no wordId: find it from the name.
    const wordId = item.wordId ?? findWord(item.name)?.id ?? null;
    const best = findOffers(item.name, mine, 50, wordId).sort(byValue)[0];
    // Normal price: only when ONE store is asked (planPerStore asks one store at a time).
    const usual = wordId && chains.length === 1 ? normal.find((n) => n.wordId === wordId && n.chain === chains[0]) : undefined;
    const base = { itemId: item.id, name: item.name, qty: item.qty };

    // Offer or normal price? The cheaper one: per kg / litre when both sizes are known, else per pack.
    const offerAmount = best ? offerAmountOf(best, wordId) : null;
    const usualAmount = usual ? amountOf(usual.size) : null;
    const normalIsCheaper =
      usual && best
        ? isBig(best) // a 12-litre crate is not what "milk" means
          ? true
          : offerAmount && usualAmount && offerAmount.unit === usualAmount.unit
          ? usual.price / usualAmount.value < best.price / offerAmount.value
          : usual.price < best.price
        : false;
    if (usual && (!best || normalIsCheaper)) {
      return {
        ...base,
        kind: 'normal',
        chain: usual.chain,
        title: usual.title,
        unitInfo: null,
        packPrice: usual.price,
        price: round(usual.price * item.qty),
        saving: 0,
        perUnit: null,
        bigPack: null,
        normal: { size: usual.size, source: usual.source, date: usual.date },
        amount: amountOf(usual.size),
      };
    }
    if (!best) {
      return { ...base, kind: 'none', chain: null, title: null, unitInfo: null, packPrice: null, price: 0, saving: 0, perUnit: null, bigPack: null, normal: null, amount: null };
    }
    const saving = best.regularPrice && best.regularPrice > best.price ? best.regularPrice - best.price : 0;
    return {
      ...base,
      kind: 'offer',
      chain: best.chain,
      title: best.title,
      unitInfo: best.unitInfo,
      packPrice: best.price,
      price: round(best.price * item.qty),
      saving: round(saving * item.qty),
      perUnit: perUnitFromInfo(best.unitInfo),
      bigPack: isBig(best) ? packAmount(best) : null,
      normal: null,
      amount: offerAmount,
      per100g: Boolean(wordId && PER_100G.includes(wordId) && !perUnitFromInfo(best.unitInfo) && best.price < 3),
    };
  });

  return {
    picks,
    total: round(picks.reduce((s, p) => s + p.price, 0)),
    saved: round(picks.reduce((s, p) => s + p.saving, 0)),
    offerCount: mine.length,
  };
}

// One plan per supermarket the user picked. The stores are compared on the whole basket:
// the items that have a price (offer or normal) in EVERY chosen store, so no store looks cheaper
// only because we know fewer of its prices. Packs differ (500 g pasta here, 1 kg there): when we know
// a store's pack size, the basket counts the same amount (the smallest known pack) for it.
// Cheapest basket first.
export interface StorePlan extends PickResult {
  chain: Chain;
  onOffer: number;
  priced: number; // items with a price in this store
  basket: number; // total of the items that every chosen store has a price for
}

export function planPerStore(
  items: PickItem[],
  chains: Chain[],
  prospekt: PickOffer[],
  normal: PickNormal[] = [],
): { stores: StorePlan[]; offerCount: number; compared: string[] } {
  const plans = chains.map((chain) => {
    const r = pickForStores(items, [chain], prospekt, normal);
    return { ...r, chain, onOffer: r.picks.filter((p) => p.kind === 'offer').length, priced: r.picks.filter((p) => p.kind !== 'none').length };
  });
  // Items every store has a price for. Not compared: things sold in very different pack sizes
  // (washing powder 20 or 100 loads, beer by the bottle or the crate, toilet paper 8 or 20 rolls).
  const wordOf = (i: PickItem) => i.wordId ?? findWord(i.name)?.id ?? null;
  const compared = items
    .filter((i) => !NOT_COMPARED.includes(wordOf(i) ?? ''))
    .map((i) => i.id)
    .filter((id) => plans.every((s) => s.picks.find((p) => p.itemId === id)?.kind !== 'none'));
  // What one item adds to the basket of one store.
  const basketPrice = (itemId: string, p: Pick): number => {
    const all = plans.map((s) => s.picks.find((x) => x.itemId === itemId)!);
    if (!p.amount || p.packPrice === null) return p.price;
    const known = all.filter((x) => x.amount && x.amount.unit === p.amount!.unit && x.amount.value > 0);
    if (known.length < 2) return p.price;
    const ref = Math.min(...known.map((x) => x.amount!.value));
    return (p.packPrice / p.amount.value) * ref * p.qty;
  };
  const stores = plans
    .map((s) => ({ ...s, basket: round(s.picks.filter((p) => compared.includes(p.itemId)).reduce((sum, p) => sum + basketPrice(p.itemId, p), 0)) }))
    .sort((a, b) => (compared.length ? a.basket - b.basket : 0) || b.priced - a.priced || b.saved - a.saved);
  return { stores, offerCount: prospekt.filter((o) => chains.includes(o.chain)).length, compared };
}
