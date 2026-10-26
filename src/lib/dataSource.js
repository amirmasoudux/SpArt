// Data source layer.
// Today it reads dummy JSON files. Later it can read a real API
// without any change to the UI or the logic: only this file changes.

import categories from '../data/categories.json';
import stores from '../data/stores.json';
import products from '../data/products.json';
import offers from '../data/offers.json';

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

// Flyer offers in Germany run weekly, so the dummy data stores weekdays
// ("MON" to "SAT") instead of fixed dates. We turn them into real dates
// of the current week, so the demo never shows expired offers.
function weekdayToDate(weekday, today) {
  const todayIndex = (today.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() - todayIndex);
  const date = new Date(monday);
  date.setDate(monday.getDate() + WEEKDAYS.indexOf(weekday));
  return date;
}

function withRealDates(offer, today) {
  const validFrom = weekdayToDate(offer.validFrom, today);
  const validTo = weekdayToDate(offer.validTo, today);
  validTo.setHours(23, 59, 59, 999);
  return { ...offer, validFrom, validTo };
}

// Every function is async on purpose: a real API call is async,
// so the rest of the app is already written for that.
export async function getCategories() {
  return [...categories].sort((a, b) => a.order - b.order);
}

export async function getStores() {
  return stores;
}

export async function getProducts() {
  return products;
}

// Only offers that are valid today.
export async function getCurrentOffers(today = new Date()) {
  return offers
    .map((offer) => withRealDates(offer, today))
    .filter((offer) => offer.validFrom <= today && today <= offer.validTo);
}
