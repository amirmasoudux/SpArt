// Shared types for the whole app.
// They match the data model in the proposal, so the backend can reuse them later.

export type Chain = 'rewe' | 'lidl' | 'aldi' | 'kaufland' | 'penny' | 'netto';

export interface Category {
  id: string;
  label: string;
  order: number;
}

export interface Store {
  id: string;
  chain: Chain;
  name: string;
  takesGlassBottles: boolean;
}

export interface ListItem {
  id: string;
  name: string;
  qty: number;
  categoryId: string; // for the order of the list: Fruit & veg, Dairy…; 'other' if we don't know
  wordId: string | null; // search word (lib/words.ts); null = searched in the Prospekte by its own words
  checked: boolean; // ticked in the store
}

export type ListStatus = 'draft' | 'confirmed' | 'done';

export interface ShoppingList {
  id: string;
  ownerId: string; // the guest id for now; a user id once accounts exist
  title: string;
  status: ListStatus;
  items: ListItem[];
  createdAt: string;
  updatedAt: string;
}

// A finished shopping trip (saved after the checklist).
export interface Trip {
  id: string;
  ownerId: string;
  listId: string;
  storeId: string;
  storeName: string;
  itemCount: number;
  total: number;
  saved: number; // money saved through Prospekt offers
  date: string;
}
