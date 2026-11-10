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

export interface MealAnswers {
  days: number;
  mealsPerDay: number;
  cook: 'quick' | 'normal' | 'love';
  avoid: ('meat' | 'pork' | 'fish' | 'dairy')[];
}
export interface Meal {
  day: string;
  name: string;
  ingredients: string[];
}

export async function fetchMealPlan(answers: MealAnswers): Promise<{ meals: Meal[]; source: 'ai' | 'recipes' } | null> {
  try {
    const { plan, source } = await post<{ plan: { meals: Meal[] }; source: 'ai' | 'recipes' }>('/api/meal-plan', answers, 20000);
    return { meals: plan.meals, source };
  } catch {
    return null;
  }
}
