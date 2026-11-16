// Finds Prospekt offers for any item on a list, by name: "Toffifee", "Lachs", "chocolate".
// Same file as server/src/lib/search.ts, so the app also works without the server.

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

// Our 27 products get a precise German word list, so "minced beef" does not show pork mince
// and "potatoes" does not show crisps. include: whole words or the end of a compound word
// ("Speisekartoffeln" ends with "kartoffeln"); phrases with a space must appear as they are.
// exclude: if one of these is in the title, it is a different product.
const PRODUCT_TERMS: Record<string, { include: string[]; exclude?: string[] }> = {
  'milk-1l': { include: ['frische milch', 'haltbare milch', 'frischmilch', 'vollmilch', 'weidemilch', 'fettarme milch', 'landmilch'], exclude: ['schoko', 'kondensmilch', 'kaffee milch'] },
  'gouda-400g': { include: ['gouda'] },
  'greek-yogurt-500g': { include: ['griech joghurt', 'griechischer joghurt', 'griechischer art'] },
  'butter-250g': { include: ['butter', 'markenbutter', 'almbutter', 'süßrahmbutter'], exclude: ['zopf', 'käse', 'kräuterbutter', 'erdnussbutter', 'croissant', 'kekse', 'cookies', 'cracker', 'schmalz', 'stollen'] },
  'eggs-10': { include: ['eier', 'freilandeier', 'bodenhaltung'] },
  'bananas-1kg': { include: ['banane', 'bananen'], exclude: ['am stiel', 'schoko', 'quark'] },
  'tomatoes-500g': { include: ['tomaten', 'tomate'], exclude: ['pesto', 'rucola', 'sauce', 'gehackt', 'passiert', 'polpa', 'pizza', 'getrocknet'] },
  cucumber: { include: ['gurke', 'gurken'], exclude: ['aufstrich', 'gewürz', 'einlege', 'cornichon'] },
  'onions-1kg': { include: ['zwiebel', 'zwiebeln'], exclude: ['lauchzwiebel', 'mettwurst', 'röst'] },
  'apples-1kg': { include: ['apfel', 'äpfel'], exclude: ['smoothie', 'saft', 'mus', 'dreieck', 'kuchen', 'riegel', 'tasche', 'granat'] },
  'potatoes-2kg': { include: ['kartoffeln'], exclude: ['marzipan', 'herzogin', 'snack', 'salat', 'gratin', 'rösti', 'brot', 'taschen', 'bowl', 'pfanne'] },
  'wholegrain-bread': { include: ['vollkornbrot', 'vollkorn brot'] },
  'toast-bread': { include: ['toast', 'toastbrot', 'buttertoast'], exclude: ['toasty', 'chick n'] },
  'chicken-breast-600g': { include: ['hähnchenbrust', 'hähnchenbrustfilet', 'hähnchenbrustfilets', 'hähnchen brustfilet', 'hähnchenbrustfilet teilstücke'], exclude: ['aufschnitt', 'roulade', 'croissant'] },
  'minced-beef-500g': { include: ['rinderhackfleisch', 'rinder hackfleisch', 'hackfleisch vom rind'] },
  'basmati-rice-1kg': { include: ['basmati', 'basmatireis'] },
  'pasta-500g': { include: ['spaghetti', 'fusilli', 'penne', 'pasta', 'teigwaren', 'nudeln', 'tagliatelle', 'maccaroni'], exclude: ['pot', 'spinaci', 'sauce', 'toscana', 'fertig', 'creamy', 'protein', 'eierspätzle', 'fix ', 'zahn'] },
  'coffee-500g': { include: ['kaffee', 'röstkaffee', 'krönung', 'prodomo', 'kaffeebohnen'], exclude: ['pads', 'kapseln', 'löslich', 'milch', 'tassimo', 'gold kaffee', 'eis', 'cappuccino'] },
  'olive-oil-750ml': { include: ['olivenöl'] },
  'canned-tomatoes-400g': { include: ['polpa', 'passata', 'gehackte tomaten', 'tomaten fein gehackt', 'geschälte tomaten'] },
  'frozen-pizza': { include: ['pizza', 'steinofenpizza', 'steinofen pizza', 'steinoffenpizza'], exclude: ['teig', 'käse', 'kit', 'sauce', 'gewürz'] },
  'frozen-spinach-450g': { include: ['spinat', 'rahmspinat', 'rahm spinat'], exclude: ['pasta', 'lachs'] },
  'sparkling-water-6x1-5l': { include: ['mineralwasser', 'sprudel'] },
  'orange-juice-1l': { include: ['orangensaft', 'o saft'] },
  'dish-soap': { include: ['spülmittel', 'geschirrspülmittel'], exclude: ['maschine', 'tabs'] },
  'toilet-paper-8': { include: ['toilettenpapier', 'klopapier'] },
  'laundry-detergent': { include: ['waschmittel', 'vollwaschmittel', 'colorwaschmittel', 'universal pulver', 'waschmittelpods', 'sunil', 'persil'] },
};

// Does the title name this product? (see PRODUCT_TERMS)
export function productMatches(title: string, productId: string): boolean {
  const rule = PRODUCT_TERMS[productId];
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

// Offers for one item, cheapest first. Items that are one of our products use the precise word list;
// anything else the user typed ("Toffifee", "chocolate") is found by its own words.
export function findOffers<T extends OfferLike>(itemName: string, offers: T[], extra: string[] = [], limit = 6, productId?: string | null): T[] {
  const match =
    productId && PRODUCT_TERMS[productId]
      ? (o: T) => productMatches(o.title, productId)
      : (() => {
          const terms = searchTerms(itemName, extra);
          return (o: T) => terms.length > 0 && titleMatches(o.title, terms);
        })();
  return offers.filter(match).sort((a, b) => a.price - b.price).slice(0, limit);
}
