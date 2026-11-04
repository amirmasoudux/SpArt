// Turns free text like "2 milk, eggs and some gouda" into list items.
// MVP version: simple rules + a word list (English and German).
// Later this step is done by the AI API with structured output; the screens stay the same.

import type { ListItem, Product } from '../types';

// Extra words people use for each product (lower case).
const ALIASES: Record<string, string[]> = {
  'milk-1l': ['milk', 'milch'],
  'gouda-400g': ['gouda', 'gauda', 'cheese', 'käse', 'kaese'],
  'greek-yogurt-500g': ['greek yogurt', 'yogurt', 'yoghurt', 'joghurt'],
  'butter-250g': ['butter'],
  'eggs-10': ['eggs', 'egg', 'eier'],
  'bananas-1kg': ['bananas', 'banana', 'bananen', 'banane'],
  'canned-tomatoes-400g': ['canned tomatoes', 'tomato can', 'dosentomaten', 'passata'],
  'tomatoes-500g': ['tomatoes', 'tomato', 'tomaten', 'tomate'],
  'cucumber': ['cucumber', 'gurke'],
  'onions-1kg': ['onions', 'onion', 'zwiebeln', 'zwiebel'],
  'apples-1kg': ['apples', 'apple', 'äpfel', 'apfel'],
  'potatoes-2kg': ['potatoes', 'potato', 'kartoffeln', 'kartoffel'],
  'toast-bread': ['toast', 'toastbrot'],
  'wholegrain-bread': ['wholegrain bread', 'bread', 'brot', 'vollkornbrot'],
  'chicken-breast-600g': ['chicken breast', 'chicken', 'hähnchen', 'haehnchen'],
  'minced-beef-500g': ['minced beef', 'mince', 'hackfleisch', 'hack'],
  'basmati-rice-1kg': ['basmati rice', 'rice', 'reis'],
  'pasta-500g': ['pasta', 'spaghetti', 'nudeln'],
  'coffee-500g': ['coffee', 'kaffee'],
  'olive-oil-750ml': ['olive oil', 'oil', 'olivenöl', 'öl'],
  'frozen-pizza': ['frozen pizza', 'pizza'],
  'frozen-spinach-450g': ['frozen spinach', 'spinach', 'spinat'],
  'sparkling-water-6x1-5l': ['sparkling water', 'water', 'wasser', 'sprudel'],
  'orange-juice-1l': ['orange juice', 'juice', 'orangensaft', 'saft'],
  'dish-soap': ['dish soap', 'washing up liquid', 'spülmittel', 'spuelmittel'],
  'toilet-paper-8': ['toilet paper', 'loo roll', 'klopapier', 'toilettenpapier'],
  'laundry-detergent': ['laundry detergent', 'detergent', 'waschmittel'],
};

const NUMBER_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  ein: 1, eine: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6,
};

const FILLER = ['some', 'a bit of', 'a few', 'please', 'etwas', 'bitte', 'of'];

// Every alias as [alias, productId], longest first, so "canned tomatoes" wins over "tomatoes".
const ALIAS_LIST = Object.entries(ALIASES)
  .flatMap(([productId, words]) => words.map((w) => [w, productId] as const))
  .sort((a, b) => b[0].length - a[0].length);

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

export function parseList(text: string, products: Product[]): ListItem[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  const items: ListItem[] = [];

  for (const part of splitIntoParts(text)) {
    const { qty, rest } = readQuantity(part);
    const name = removeFiller(rest);
    if (!name) continue;

    const match = ALIAS_LIST.find(([alias]) => new RegExp(`(^|\\s)${alias}(\\s|$)`).test(name));
    const product = match ? byId.get(match[1]) : undefined;

    // Same product twice ("milk, milk") → add up the quantity.
    const existing = product && items.find((i) => i.productId === product.id);
    if (existing) {
      existing.qty = Math.min(20, existing.qty + qty);
      continue;
    }

    items.push({
      id: newId(),
      name: product ? product.name : capitalize(name),
      qty: Math.min(20, Math.max(1, qty)),
      unit: product ? product.unit : '',
      categoryId: product ? product.category : 'other',
      productId: product ? product.id : null,
      checked: false,
    });
  }
  return items;
}

// Used when the user renames an item on the review screen.
export function matchProduct(name: string, products: Product[]): Product | undefined {
  const lower = name.toLowerCase().trim();
  const match = ALIAS_LIST.find(([alias]) => new RegExp(`(^|\\s)${alias}(\\s|$)`).test(lower));
  return match ? products.find((p) => p.id === match[1]) : undefined;
}
