// Matches a product name from a Prospekt (e.g. "Weihenstephan H-Milch 1,5%") to a product in our catalog.
// Same idea as the list parser in the app: known words per product, longest first.
// Later this list can move to the database, and the AI can suggest matches for unknown names.
import type { Product } from '../schemas.js';

export const ALIASES: Record<string, string[]> = {
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

const ALIAS_LIST = Object.entries(ALIASES)
  .flatMap(([productId, words]) => words.map((w) => [w, productId] as const))
  .sort((a, b) => b[0].length - a[0].length);

// German flyers write "H-Milch", "Bio-Bananen": treat dashes and commas as spaces.
const clean = (s: string) => ` ${s.toLowerCase().replace(/[-,.()%/]/g, ' ').replace(/\s+/g, ' ').trim()} `;

export function matchProduct(name: string, products: Product[]): Product | undefined {
  const text = clean(name);
  const find = (test: (alias: string) => boolean) => {
    for (const [alias, productId] of ALIAS_LIST) {
      if (!test(alias)) continue;
      const product = products.find((p) => p.id === productId);
      if (product) return product;
    }
    return undefined;
  };
  // 1) The whole word: "Gouda jung" → gouda.
  // 2) German compound words that END with a known word: "Vollmilch" → milch, "Rispentomaten" → tomaten.
  return find((alias) => text.includes(` ${alias} `)) ?? find((alias) => alias.length >= 4 && text.includes(`${alias} `));
}
