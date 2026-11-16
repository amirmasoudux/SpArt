// Finds Prospekt offers for any item on a list, by name: "Toffifee", "Lachs", "chocolate".
// Same file as server/src/lib/search.ts, so the app also works without the server.
import { wordById } from './words';

// Prospekte are German. Common English words → German, so "chocolate" finds "Schokolade".
const EN_DE: Record<string, string[]> = {
  apple: ['apfel', 'äpfel'], apples: ['apfel', 'äpfel'], avocado: ['avocado', 'avocados'], bacon: ['bacon', 'speck'],
  banana: ['banane', 'bananen'], bananas: ['banane', 'bananen'], beef: ['rind', 'rinder'], beer: ['bier', 'pils', 'kölsch', 'helles'],
  blueberries: ['heidelbeeren', 'blaubeeren'], bread: ['brot', 'brötchen'], butter: ['butter'], cake: ['kuchen'],
  cauliflower: ['blumenkohl'], cheese: ['käse', 'gouda', 'mozzarella', 'cheddar'], chicken: ['hähnchen', 'huhn', 'chicken'],
  chips: ['chips', 'crunchips'], chocolate: ['schokolade'], coffee: ['kaffee'], cola: ['cola'], cucumber: ['gurke', 'gurken'],
  detergent: ['waschmittel'], diapers: ['windeln'], dish: ['spülmittel'], eggs: ['eier'], fish: ['fisch', 'lachs'],
  flour: ['mehl'], gin: ['gin'], honey: ['honig'], ice: ['eis'], juice: ['saft'], lemon: ['zitrone', 'zitronen'],
  lemons: ['zitronen'], milk: ['milch'], mince: ['hackfleisch'], mushrooms: ['champignons'], nuts: ['nüsse', 'nuss', 'kerne'],
  oil: ['öl'], onion: ['zwiebel', 'zwiebeln'], onions: ['zwiebeln'], orange: ['orange', 'orangen'], oranges: ['orangen'],
  pasta: ['pasta', 'spaghetti', 'nudeln', 'tagliatelle'], pepper: ['paprika', 'pfeffer'], pizza: ['pizza'], pork: ['schwein', 'schweine'],
  potatoes: ['kartoffeln', 'kartoffel'], raspberries: ['himbeeren'], rice: ['reis'], salad: ['salat'], salami: ['salami'],
  salmon: ['lachs'], sausage: ['wurst', 'würstchen'], shampoo: ['shampoo'], soap: ['seife'], spinach: ['spinat'],
  sugar: ['zucker'], tea: ['tee'], toast: ['toast'], tomato: ['tomate', 'tomaten'], tomatoes: ['tomaten'],
  turkey: ['pute', 'puten'], vodka: ['vodka', 'wodka'], water: ['wasser', 'mineralwasser'], whisky: ['whisky', 'whiskey'],
  wine: ['wein'], yogurt: ['joghurt'], yoghurt: ['joghurt'],
};

// Compound words that END like a search word but are something else:
// "Lauchzwiebeln" are spring onions (not "zwiebeln"), "Milchreis" is rice pudding (not "reis").
const NOT_THE_SAME: Record<string, string[]> = {
  zwiebel: ['lauchzwiebel'], zwiebeln: ['lauchzwiebeln'], reis: ['milchreis'], milch: ['buttermilch', 'kokosmilch', 'reinigungsmilch'],
};

export const normalize = (s: string) =>
  s.toLowerCase().replace(/ae/g, 'ä').replace(/oe/g, 'ö').replace(/ue/g, 'ü').replace(/[^a-zäöüß0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

// The words we look for: the item's own words (3+ letters) and their German translation.
export function searchTerms(itemName: string): string[] {
  const words = normalize(itemName)
    .split(' ')
    .filter((w) => w.length >= 3 && !/^\d/.test(w));
  const terms = new Set<string>();
  for (const w of words) {
    terms.add(w);
    for (const t of EN_DE[w] ?? []) terms.add(t);
  }
  return [...terms];
}

// Words that may also START a compound word: "Lachsfilet" is salmon, "Hähnchenbrust" is chicken.
// Only for these few, because "Milchschokolade" is not milk.
const PREFIX_OK = ['lachs', 'hähnchen', 'puten', 'rinder', 'schweine', 'kartoffel'];

// A title matches when one of its words IS a term, or a German compound word ENDS with it
// ("Weidemilch" → milch, "Rispentomaten" → tomaten). Short terms (under 4 letters) must match a whole word.
export function titleMatches(title: string, terms: string[]): boolean {
  return normalize(title)
    .split(' ')
    .some((w) =>
      terms.some((term) => {
        if (w === term) return true;
        if (PREFIX_OK.includes(term) && w.startsWith(term)) return true;
        if (term.length < 4 || !w.endsWith(term)) return false;
        return !(NOT_THE_SAME[term] ?? []).some((other) => w.startsWith(other));
      }),
    );
}

// Does the Prospekt title name this search word? (see words.ts: include / exclude)
export function wordMatches(title: string, wordId: string): boolean {
  const rule = wordById(wordId);
  if (!rule) return false;
  const t = ` ${normalize(title)} `;
  if ((rule.exclude ?? []).some((x) => t.includes(x))) return false;
  const words = t.trim().split(' ');
  return rule.include.some((term) =>
    term.includes(' ') ? t.includes(` ${term} `) : words.some((w) => w === term || (term.length >= 4 && w.endsWith(term))),
  );
}

export interface OfferLike {
  chain: string;
  title: string;
  price: number;
  regularPrice: number | null;
  unitInfo: string | null;
}

// Offers for one item, cheapest first. Items found in the search words use their German words;
// anything else the user typed ("Toffifee", "Lachs") is found by its own words.
export function findOffers<T extends OfferLike>(itemName: string, offers: T[], limit = 6, wordId?: string | null): T[] {
  const match =
    wordId && wordById(wordId)
      ? (o: T) => wordMatches(o.title, wordId)
      : (() => {
          const terms = searchTerms(itemName);
          return (o: T) => terms.length > 0 && titleMatches(o.title, terms);
        })();
  return offers.filter(match).sort((a, b) => a.price - b.price).slice(0, limit);
}
