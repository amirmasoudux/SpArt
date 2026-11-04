// Data source layer.
// Today it reads dummy JSON files. Later it reads the real API (Express + MongoDB)
// without any change to the screens or the logic: only this file changes.

import categoriesJson from '../data/categories.json';
import storesJson from '../data/stores.json';
import productsJson from '../data/products.json';
import offersJson from '../data/offers.json';
import type { Category, Chain, Offer, Product, Store } from '../types';

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

// Flyer offers in Germany run weekly, so the dummy data stores weekdays
// ("MON" to "SAT") instead of fixed dates. We turn them into real dates
// of the current week, so the demo never shows expired offers.
function weekdayToDate(weekday: string, today: Date): Date {
  const todayIndex = (today.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() - todayIndex);
  const date = new Date(monday);
  date.setDate(monday.getDate() + WEEKDAYS.indexOf(weekday));
  return date;
}

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
  return (offersJson as { id: string; chain: Chain; productId: string; price: number; validFrom: string; validTo: string }[])
    .map((o) => {
      const validFrom = weekdayToDate(o.validFrom, today);
      const validTo = weekdayToDate(o.validTo, today);
      validTo.setHours(23, 59, 59, 999);
      return { ...o, validFrom, validTo };
    })
    .filter((o) => o.validFrom <= today && today <= o.validTo);
}
