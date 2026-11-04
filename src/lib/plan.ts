// The core idea of SpArt: which store is best for this list,
// and what is the real saving after the cost of getting there.

import type { ListItem, Offer, Product, Settings, Store, TravelMode } from '../types';

// Cost per km for each travel mode (round trip is counted below).
// Car: rough average fuel + wear. Bike, walking, Deutschlandticket: no extra cost.
export const COST_PER_KM: Record<TravelMode, number> = { car: 0.3, bike: 0, walk: 0, transit: 0 };

export const TRAVEL_LABELS: Record<TravelMode, string> = {
  car: 'Car',
  bike: 'Bike',
  walk: 'On foot',
  transit: 'Bus or train',
};

// Distance in km between two points (haversine formula).
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export interface PlanLine {
  itemId: string;
  name: string;
  qty: number;
  price: number; // what you pay for this line
  saving: number; // offer saving for this line (0 if no offer)
  onOffer: boolean;
}

export interface StorePlan {
  store: Store;
  distance: number;
  tripCost: number;
  basketTotal: number;
  offerSavings: number;
  netSaving: number; // offer savings minus trip cost
  totalCost: number; // basket + trip, used to pick the best store
  lines: PlanLine[];
  noPriceCount: number; // items we have no price for
}

export function planForStore(items: ListItem[], store: Store, products: Product[], offers: Offer[], settings: Settings): StorePlan {
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

  const distance = distanceKm(settings.home, store.location);
  const tripCost = distance * 2 * COST_PER_KM[settings.travelMode];
  const basketTotal = lines.reduce((sum, l) => sum + l.price, 0);
  const offerSavings = lines.reduce((sum, l) => sum + l.saving, 0);

  return {
    store,
    distance,
    tripCost,
    basketTotal,
    offerSavings,
    netSaving: offerSavings - tripCost,
    totalCost: basketTotal + tripCost,
    lines: lines.sort((a, b) => b.saving - a.saving),
    noPriceCount,
  };
}

// All stores, best first (cheapest basket + trip).
export function rankStores(items: ListItem[], stores: Store[], products: Product[], offers: Offer[], settings: Settings): StorePlan[] {
  return stores
    .map((s) => planForStore(items, s, products, offers, settings))
    .sort((a, b) => a.totalCost - b.totalCost);
}

export function euro(n: number): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(n);
}
