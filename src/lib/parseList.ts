// Turns free text like "2 milk, eggs and some gouda" into list items.
// Simple rules + the search words (English and German, lib/words.ts). Any other word is kept as typed.
// Later this step is done by the AI API with structured output; the screens stay the same.

import type { ListItem } from '../types';
import { findWord } from './words';

const NUMBER_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  ein: 1, eine: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6,
};

const FILLER = ['some', 'a bit of', 'a few', 'please', 'etwas', 'bitte', 'of'];

function splitIntoParts(text: string): string[] {
  return text
    .toLowerCase()
    .split(/,|;|\n|\band\b|\bund\b|\+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function readQuantity(part: string): { qty: number; rest: string } {
  // "2 milk", "2x milk", "milk x2", "milk × 2"
  const lead = part.match(/^(\d+)\s*(x|×)?\s+(.*)$/);
  if (lead) return { qty: Number(lead[1]), rest: lead[3] };
  const trail = part.match(/^(.*?)\s*(x|×)\s*(\d+)$/);
  if (trail) return { qty: Number(trail[3]), rest: trail[1] };
  const [first, ...others] = part.split(/\s+/);
  if (first in NUMBER_WORDS && others.length > 0) return { qty: NUMBER_WORDS[first], rest: others.join(' ') };
  return { qty: 1, rest: part };
}

function removeFiller(text: string): string {
  let t = ` ${text} `;
  for (const f of FILLER) t = t.replace(new RegExp(`\\s${f}\\s`, 'g'), ' ');
  return t.trim();
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function newId(): string {
  return crypto.randomUUID();
}

export function parseList(text: string): ListItem[] {
  const items: ListItem[] = [];

  for (const part of splitIntoParts(text)) {
    const { qty, rest } = readQuantity(part);
    const name = removeFiller(rest);
    if (!name) continue;

    const word = findWord(name);

    // Same thing twice ("milk, milk") → add up the quantity.
    const existing = items.find((i) => (word ? i.wordId === word.id : i.name.toLowerCase() === name));
    if (existing) {
      existing.qty = Math.min(20, existing.qty + qty);
      continue;
    }

    items.push({
      id: newId(),
      name: word ? word.name : capitalize(name),
      qty: Math.min(20, Math.max(1, qty)),
      categoryId: word ? word.category : 'other',
      wordId: word ? word.id : null,
      checked: false,
    });
  }
  return items;
}

// Used when the user renames an item on the check screen.
export function itemFromName(name: string): Pick<ListItem, 'name' | 'categoryId' | 'wordId'> {
  const word = findWord(name);
  return { name: word ? word.name : name, categoryId: word ? word.category : 'other', wordId: word ? word.id : null };
}
