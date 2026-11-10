// Talking to the backend (Express).
// If the backend is not running, the app uses the same logic with the local demo data,
// so the app still works in a demo. The screens don't need to know which one answered.
import { getCurrentOffers, getProducts, getStores } from './dataSource';
import { rankStores, type StorePlan } from './plan';
import type { ListItem } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export interface PlanResult {
  plans: StorePlan[];
  offerCount: number;
  source: 'server' | 'local';
}

export async function fetchPlan(items: ListItem[]): Promise<PlanResult> {
  try {
    const res = await fetch(`${API_URL}/api/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items.map(({ id, name, qty, productId }) => ({ id, name, qty, productId })) }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = (await res.json()) as { plans: StorePlan[]; offerCount: number };
    return { ...data, source: 'server' };
  } catch {
    const offers = getCurrentOffers();
    return { plans: rankStores(items, getStores(), getProducts(), offers), offerCount: offers.length, source: 'local' };
  }
}
