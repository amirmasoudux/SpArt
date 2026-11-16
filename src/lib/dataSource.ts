// Data source layer: the same real data files the server uses, built into the app,
// so the app still works while the server is waking up.

import categoriesJson from '../data/categories.json';
import storesJson from '../data/stores.json';
import productsJson from '../data/products.json';
import type { Category, Chain, Offer, Product, Store } from '../types';

// This week's real offers matched to our products (the same files the server loads).
const importedFiles = import.meta.glob('../../server/data/imported/*.json', { eager: true, import: 'default' });
const importedOffers = Object.values(importedFiles).flat() as {
  id: string; chain: Chain; productId: string; price: number; validFrom: string; validTo: string;
}[];

export const OTHER_CATEGORY: Category = { id: 'other', label: 'Other', order: 99 };

export function getCategories(): Category[] {
  return [...(categoriesJson as Category[]), OTHER_CATEGORY].sort((a, b) => a.order - b.order);
}

export function getStores(): Store[] {
  return storesJson as Store[];
}

export function getProducts(): Product[] {
  return productsJson as Product[];
}

// Only offers that are valid today.
export function getCurrentOffers(today = new Date()): Offer[] {
  return importedOffers
    .map((o) => ({ id: o.id, chain: o.chain, productId: o.productId, price: o.price, validFrom: new Date(o.validFrom), validTo: new Date(o.validTo) }))
    .filter((o) => o.validFrom <= today && today <= o.validTo);
}
