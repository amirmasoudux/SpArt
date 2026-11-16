// Data source layer: the same data files the server uses, built into the app,
// so the app still works while the server is waking up. Prices: only Prospekt offers (see prospekt.ts).

import categoriesJson from '../data/categories.json';
import storesJson from '../data/stores.json';
import type { Category, Store } from '../types';

export const OTHER_CATEGORY: Category = { id: 'other', label: 'Other', order: 99 };

export function getCategories(): Category[] {
  return [...(categoriesJson as Category[]), OTHER_CATEGORY].sort((a, b) => a.order - b.order);
}

export function getStores(): Store[] {
  return storesJson as Store[];
}
