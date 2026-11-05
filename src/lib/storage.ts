// Guest mode: no login in the MVP.
// Each browser gets a random guest id, and lists are saved in localStorage.
// Later the same functions can call the API instead (lists get the user id).

import type { ShoppingList } from '../types';

const KEYS = {
  guestId: 'spart:guestId',
  lists: 'spart:lists',
};

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
