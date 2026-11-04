// Shared types for the whole app.
// They match the data model in the proposal, so the backend can reuse them later.

export type Chain = 'rewe' | 'lidl' | 'aldi';

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

export interface Product {
  id: string;
  name: string;
  unit: string;
  category: string;
  prices: Record<Chain, number>;
}

export interface Offer {
  id: string;
  chain: Chain;
  productId: string;
  price: number;
  validFrom: Date;
  validTo: Date;
}

export interface ListItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  categoryId: string;
  productId: string | null; // null = not in our catalog yet, so no price
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
