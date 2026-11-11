// Finds Prospekt offers for any item on a list, by name: "Toffifee", "Lachs", "chocolate".
// The same file is copied to the app (src/lib/search.ts) so it also works without the server.

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

// The words we look for: the item's own words (3+ letters), their German translation, and extra words
// (e.g. the German name of the catalog product the item belongs to).
export function searchTerms(itemName: string, extra: string[] = []): string[] {
  const words = normalize(itemName)
    .split(' ')
    .filter((w) => w.length >= 3 && !/^\d/.test(w));
  const terms = new Set<string>();
  for (const w of [...words, ...extra.map(normalize)]) {
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

export interface OfferLike {
  chain: string;
  title: string;
  price: number;
  regularPrice: number | null;
  unitInfo: string | null;
}

// Offers for one item, cheapest first.
export function findOffers<T extends OfferLike>(itemName: string, offers: T[], extra: string[] = [], limit = 6): T[] {
  const terms = searchTerms(itemName, extra);
  if (terms.length === 0) return [];
  return offers.filter((o) => titleMatches(o.title, terms)).sort((a, b) => a.price - b.price).slice(0, limit);
}
