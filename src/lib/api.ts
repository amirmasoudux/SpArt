// Talking to the backend (Express).
// If the backend is not running, the app uses the same logic with the built-in data files,
// so the app still works in a demo. The screens don't need to know which one answered.
import { getProducts, getStores } from './dataSource';
import { ALIASES } from './parseList';
import { pickForStores, type PickResult } from './pick';
import { getProspektOffers } from './prospekt';
import type { Chain, ListItem } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export interface PlanResult extends PickResult {
  chains: Chain[];
  source: 'server' | 'local';
}

// The plan for the user's own supermarkets. Server first; without it the same logic runs on the built-in data.
export async function fetchPlan(items: ListItem[], chains: Chain[]): Promise<PlanResult> {
  const useChains = chains.length ? chains : getStores().map((s) => s.chain);
  const body = { items: items.map(({ id, name, qty, productId }) => ({ id, name, qty, productId })), chains: useChains };
  try {
    const res = await fetch(`${API_URL}/api/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = (await res.json()) as PickResult;
    if (!Array.isArray(data.picks)) throw new Error('old server');
    return { ...data, chains: useChains, source: 'server' };
  } catch {
    return { ...pickForStores(body.items, useChains, getProducts(), getProspektOffers(), ALIASES), chains: useChains, source: 'local' };
  }
}

// ---- Week 3 ----

async function post<T>(path: string, body: unknown, timeoutMs = 8000): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return (await res.json()) as T;
}

// Items the simple parser did not know: ask the AI on the server. If that fails, keep them as they are.
export async function improveUnknownItems(items: ListItem[]): Promise<ListItem[]> {
  const unknown = items.filter((i) => !i.productId);
  if (unknown.length === 0) return items;
  try {
    const { matches } = await post<{ matches: { name: string; productId: string | null }[] }>('/api/items/match', {
      names: unknown.map((i) => i.name),
    });
    const products = getProducts();
    return items.map((item) => {
      if (item.productId) return item;
      const product = products.find((p) => p.id === matches.find((m) => m.name === item.name)?.productId);
      return product ? { ...item, name: product.name, productId: product.id, unit: product.unit, categoryId: product.category } : item;
    });
  } catch {
    return items;
  }
}

export interface ReportInput {
  productId: string;
  storeId: string;
  kind: 'wrong_price' | 'offer_ended' | 'not_in_store' | 'other';
  correctPrice?: number | null;
}

export async function sendReport(report: ReportInput): Promise<boolean> {
  try {
    await post('/api/reports', report);
    return true;
  } catch {
    return false;
  }
}

