// Guest mode: no login in the MVP.
// Each browser gets a random guest id, and lists, trips and settings are saved in localStorage.
// Later the same functions can call the API instead (lists and trips get the user id).

import type { Settings, ShoppingList, Trip } from '../types';

const KEYS = {
  guestId: 'spart:guestId',
  lists: 'spart:lists',
  trips: 'spart:trips',
  settings: 'spart:settings',
};

// Siegburg town centre as the default home point.
export const DEFAULT_SETTINGS: Settings = { travelMode: 'car', home: { lat: 50.7997, lng: 7.2075 } };

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or storage full: the app still works for this visit.
  }
}

export function getGuestId(): string {
  let id = read<string | null>(KEYS.guestId, null);
  if (!id) {
    id = crypto.randomUUID();
    write(KEYS.guestId, id);
  }
  return id;
}

// Lists
export function getLists(): ShoppingList[] {
  return read<ShoppingList[]>(KEYS.lists, []).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getList(id: string): ShoppingList | undefined {
  return getLists().find((l) => l.id === id);
}

export function saveList(list: ShoppingList): void {
  const others = read<ShoppingList[]>(KEYS.lists, []).filter((l) => l.id !== list.id);
  write(KEYS.lists, [...others, { ...list, updatedAt: new Date().toISOString() }]);
}

export function deleteList(id: string): void {
  write(KEYS.lists, read<ShoppingList[]>(KEYS.lists, []).filter((l) => l.id !== id));
}

// Trips
export function getTrips(): Trip[] {
  return read<Trip[]>(KEYS.trips, []).sort((a, b) => b.date.localeCompare(a.date));
}

export function getTrip(id: string): Trip | undefined {
  return getTrips().find((t) => t.id === id);
}

export function saveTrip(trip: Trip): void {
  write(KEYS.trips, [...read<Trip[]>(KEYS.trips, []), trip]);
}

// Settings
export function getSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...read<Partial<Settings>>(KEYS.settings, {}) };
}

export function saveSettings(settings: Settings): void {
  write(KEYS.settings, settings);
}
