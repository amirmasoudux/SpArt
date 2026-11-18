// Data source layer: the same data files the server uses, built into the app,
// so the app still works while the server is waking up. Prices: Prospekt offers (prospekt.ts) and normal prices (server/data/prices.json).

import categoriesJson from '../data/categories.json';
import pricesJson from '../../server/data/prices.json';
import type { PickNormal } from './pick';
import storesJson from '../data/stores.json';
import type { Category, Store } from '../types';

export const OTHER_CATEGORY: Category = { id: 'other', label: 'Other', order: 99 };

export function getCategories(): Category[] {
  return [...(categoriesJson as Category[]), OTHER_CATEGORY].sort((a, b) => a.order - b.order);
}

export function getStores(): Store[] {
  return storesJson as Store[];
}

// Real normal prices (ALDI SÜD website, REWE online shop, Open Prices), the same file the server loads.
export function getNormalPrices(): PickNormal[] {
  return pricesJson as PickNormal[];
}
