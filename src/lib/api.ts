// Talking to the backend (Express).
// If the backend is not running, the app uses the same logic with the built-in data files,
// so the app still works in a demo. The screens don't need to know which one answered.
import { getStores } from './dataSource';
import { planPerStore, type StorePlan } from './pick';
import { getProspektOffers } from './prospekt';
import { wordById } from './words';
import type { Chain, ListItem } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export interface PlanResult {
  stores: StorePlan[]; // one plan per supermarket the user picked, best first
  offerCount: number;
  chains: Chain[];
  source: 'server' | 'local';
}

// What the plan screen gets from Analyze, or passes to and from the checklist (with the chosen supermarket).
export type PlanState = PlanResult | { result: PlanResult; chain?: Chain } | undefined;
export const resultOf = (s: PlanState) => (s && 'result' in s ? s.result : s);

// One plan per supermarket the user picked. Server first; without it the same logic runs on the built-in data.
export async function fetchPlan(items: ListItem[], chains: Chain[]): Promise<PlanResult> {
  const useChains = chains.length ? chains : getStores().map((s) => s.chain);
  const body = { items: items.map(({ id, name, qty, wordId }) => ({ id, name, qty, wordId: wordId ?? null })), chains: useChains };
  try {
    const res = await fetch(`${API_URL}/api/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = (await res.json()) as { stores: StorePlan[]; offerCount: number };
    if (!Array.isArray(data.stores)) throw new Error('old server');
    return { ...data, chains: useChains, source: 'server' };
  } catch {
    return { ...planPerStore(body.items, useChains, getProspektOffers()), chains: useChains, source: 'local' };
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

// Items the simple parser did not know ("banans"): ask the AI on the server which search word they are.
// If that fails, keep them as they are (they are still searched by name).
export async function improveUnknownItems(items: ListItem[]): Promise<ListItem[]> {
  const unknown = items.filter((i) => !i.wordId);
  if (unknown.length === 0) return items;
  try {
    const { matches } = await post<{ matches: { name: string; wordId: string | null }[] }>('/api/items/match', {
      names: unknown.map((i) => i.name),
    });
    return items.map((item) => {
      if (item.wordId) return item;
      const word = wordById(matches.find((m) => m.name === item.name)?.wordId);
      return word ? { ...item, name: word.name, wordId: word.id, categoryId: word.category } : item;
    });
  } catch {
    return items;
  }
}

export interface ReportInput {
  offerTitle: string;
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

