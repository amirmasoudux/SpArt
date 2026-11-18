// Search words: what people type (English or German) → how the item is called in German Prospekte.
// No products, no prices, no sizes. Only words, so "minced beef" finds "Rinderhackfleisch"
// and not pork mince, and the list can be ordered by category (Fruit & veg, Dairy…).
// Anything not in this list is still searched in the Prospekte by its own words.
// The same file is in the server (server/src/lib/words.ts).

export interface SearchWord {
  id: string;
  name: string; // shown on the list
  category: string; // see categories.json
  words: string[]; // what people type, lower case (English and German)
  include: string[]; // German words in Prospekt titles: whole words or the end of a compound word; phrases with a space as they are
  exclude?: string[]; // if one of these is in the title, it is something else
}

export const WORDS: SearchWord[] = [
  // Fruit & veg
  { id: 'bananas', name: 'Bananas', category: 'produce', words: ['bananas', 'banana', 'bananen', 'banane'], include: ['banane', 'bananen'], exclude: ['am stiel', 'schoko', 'quark'] },
  { id: 'tomatoes', name: 'Tomatoes', category: 'produce', words: ['tomatoes', 'tomato', 'tomaten', 'tomate'], include: ['tomaten', 'tomate'], exclude: ['pesto', 'rucola', 'sauce', 'gehackt', 'passiert', 'polpa', 'pizza', 'getrocknet', 'mark', 'ketchup'] },
  { id: 'cucumber', name: 'Cucumber', category: 'produce', words: ['cucumbers', 'cucumber', 'gurken', 'gurke'], include: ['gurke', 'gurken'], exclude: ['aufstrich', 'gewürz', 'einlege', 'cornichon'] },
  { id: 'onions', name: 'Onions', category: 'produce', words: ['onions', 'onion', 'zwiebeln', 'zwiebel'], include: ['zwiebel', 'zwiebeln'], exclude: ['lauchzwiebel', 'frühlingszwiebel', 'mettwurst', 'röst'] },
  { id: 'apples', name: 'Apples', category: 'produce', words: ['apples', 'apple', 'äpfel', 'apfel'], include: ['apfel', 'äpfel'], exclude: ['smoothie', 'saft', 'mus', 'dreieck', 'kuchen', 'riegel', 'tasche', 'granat', 'essig'] },
  { id: 'potatoes', name: 'Potatoes', category: 'produce', words: ['potatoes', 'potato', 'kartoffeln', 'kartoffel'], include: ['kartoffeln'], exclude: ['marzipan', 'herzogin', 'snack', 'salat', 'gratin', 'rösti', 'brot', 'taschen', 'bowl', 'pfanne', 'chips'] },
  // Bread
  { id: 'wholegrain-bread', name: 'Whole-grain bread', category: 'bakery', words: ['wholegrain bread', 'whole grain bread', 'vollkornbrot'], include: ['vollkornbrot', 'vollkorn brot'] },
  { id: 'toast', name: 'Toast bread', category: 'bakery', words: ['toast bread', 'toast', 'toastbrot'], include: ['toast', 'toastbrot', 'buttertoast'], exclude: ['toasty', 'chick n'] },
  { id: 'bread', name: 'Bread', category: 'bakery', words: ['bread', 'brot'], include: ['brot', 'baguette', 'brötchen'], exclude: ['knusper', 'aufstrich', 'chips', 'kartoffel'] },
  // Dairy & eggs
  { id: 'milk', name: 'Milk', category: 'dairy', words: ['milk', 'milch'], include: ['frische milch', 'haltbare milch', 'frischmilch', 'vollmilch', 'weidemilch', 'fettarme milch', 'landmilch'], exclude: ['schoko', 'kondensmilch', 'kaffee milch'] },
  { id: 'gouda', name: 'Gouda', category: 'dairy', words: ['gouda', 'gauda'], include: ['gouda'] },
  { id: 'cheese', name: 'Cheese', category: 'dairy', words: ['cheese', 'käse', 'kaese'], include: ['käse', 'gouda', 'emmentaler', 'mozzarella', 'cheddar', 'edamer', 'bergkäse', 'leerdammer'], exclude: ['kuchen', 'pizza', 'käsekuchen', 'sahne', 'spätzle', 'backfrische', 'ofenfrische', 'baguette'] },
  { id: 'greek-yogurt', name: 'Greek yogurt', category: 'dairy', words: ['greek yogurt', 'greek yoghurt', 'griechischer joghurt'], include: ['griech joghurt', 'griechischer joghurt', 'griechischer art'] },
  { id: 'yogurt', name: 'Yogurt', category: 'dairy', words: ['yogurt', 'yoghurt', 'joghurt'], include: ['joghurt'], exclude: ['butter', 'riegel', 'drops'] },
  { id: 'butter', name: 'Butter', category: 'dairy', words: ['butter'], include: ['butter', 'markenbutter', 'almbutter', 'süßrahmbutter'], exclude: ['zopf', 'käse', 'kräuterbutter', 'erdnussbutter', 'croissant', 'kekse', 'cookies', 'cracker', 'schmalz', 'stollen'] },
  { id: 'eggs', name: 'Eggs', category: 'dairy', words: ['eggs', 'egg', 'eier'], include: ['eier', 'freilandeier', 'bodenhaltung'], exclude: ['nudeln', 'likör', 'salat'] },
  // Meat & fish
  { id: 'chicken-breast', name: 'Chicken breast', category: 'meat', words: ['chicken breast', 'chicken', 'hähnchenbrust', 'hähnchen', 'haehnchen'], include: ['hähnchenbrust', 'hähnchenbrustfilet', 'hähnchenbrustfilets', 'hähnchen brustfilet'], exclude: ['aufschnitt', 'roulade', 'croissant'] },
  { id: 'minced-beef', name: 'Minced beef', category: 'meat', words: ['minced beef', 'ground beef', 'mince', 'rinderhackfleisch', 'hackfleisch', 'hack'], include: ['rinderhackfleisch', 'rinder hackfleisch', 'hackfleisch vom rind'] },
  { id: 'salmon', name: 'Salmon', category: 'meat', words: ['salmon', 'lachs'], include: ['lachs', 'lachsfilet', 'lachsfilets'], exclude: ['schinken', 'ersatz'] },
  // Pantry
  { id: 'rice', name: 'Rice', category: 'pantry', words: ['basmati rice', 'basmati', 'rice', 'reis'], include: ['reis', 'basmati', 'basmatireis', 'langkornreis', 'jasminreis'], exclude: ['milchreis', 'reiswaffel', 'waffeln', 'drink'] },
  { id: 'pasta', name: 'Pasta', category: 'pantry', words: ['pasta', 'spaghetti', 'nudeln', 'noodles'], include: ['spaghetti', 'fusilli', 'penne', 'pasta', 'teigwaren', 'nudeln', 'tagliatelle', 'maccaroni'], exclude: ['pot', 'spinaci', 'sauce', 'toscana', 'fertig', 'creamy', 'protein', 'eierspätzle', 'fix ', 'zahn'] },
  { id: 'coffee', name: 'Coffee', category: 'pantry', words: ['coffee', 'kaffee'], include: ['kaffee', 'röstkaffee', 'krönung', 'prodomo', 'kaffeebohnen'], exclude: ['pads', 'kapseln', 'löslich', 'milch', 'tassimo', 'gold kaffee', 'eis', 'cappuccino'] },
  { id: 'olive-oil', name: 'Olive oil', category: 'pantry', words: ['olive oil', 'olivenöl', 'olivenoel'], include: ['olivenöl'] },
  { id: 'canned-tomatoes', name: 'Canned tomatoes', category: 'pantry', words: ['canned tomatoes', 'tomato can', 'chopped tomatoes', 'dosentomaten', 'passata'], include: ['polpa', 'passata', 'gehackte tomaten', 'tomaten fein gehackt', 'geschälte tomaten'] },
  { id: 'chocolate', name: 'Chocolate', category: 'pantry', words: ['chocolate', 'schokolade'], include: ['schokolade', 'tafelschokolade'], exclude: ['drink', 'pudding', 'eis'] },
  // Frozen
  { id: 'pizza', name: 'Frozen pizza', category: 'frozen', words: ['frozen pizza', 'pizza'], include: ['pizza', 'steinofenpizza', 'steinofen pizza', 'steinoffenpizza'], exclude: ['teig', 'käse', 'kit', 'sauce', 'gewürz'] },
  { id: 'spinach', name: 'Frozen spinach', category: 'frozen', words: ['frozen spinach', 'spinach', 'spinat'], include: ['spinat', 'rahmspinat', 'rahm spinat'], exclude: ['pasta', 'lachs'] },
  // Drinks
  { id: 'water', name: 'Sparkling water', category: 'drinks', words: ['sparkling water', 'water', 'mineralwasser', 'wasser', 'sprudel'], include: ['mineralwasser', 'sprudel'] },
  { id: 'orange-juice', name: 'Orange juice', category: 'drinks', words: ['orange juice', 'orangensaft', 'o saft'], include: ['orangensaft', 'o saft'] },
  { id: 'beer', name: 'Beer', category: 'drinks', words: ['beer', 'bier'], include: ['bier', 'pils', 'kölsch', 'helles', 'weizen'], exclude: ['alkoholfrei mix', 'essig'] },
  // Household
  { id: 'dish-soap', name: 'Dish soap', category: 'household', words: ['dish soap', 'washing up liquid', 'spülmittel', 'spuelmittel'], include: ['spülmittel', 'geschirrspülmittel'], exclude: ['maschine', 'tabs'] },
  { id: 'toilet-paper', name: 'Toilet paper', category: 'household', words: ['toilet paper', 'loo roll', 'klopapier', 'toilettenpapier'], include: ['toilettenpapier', 'klopapier'] },
  { id: 'detergent', name: 'Laundry detergent', category: 'household', words: ['laundry detergent', 'detergent', 'waschmittel'], include: ['waschmittel', 'vollwaschmittel', 'colorwaschmittel', 'universal pulver', 'waschmittelpods', 'sunil', 'persil'] },
];

// Every typed word as [word, entry], longest first, so "canned tomatoes" wins over "tomatoes".
const WORD_LIST = WORDS.flatMap((w) => w.words.map((typed) => [typed, w] as const)).sort((a, b) => b[0].length - a[0].length);

// "2 minced beef please" → the Minced beef entry. undefined = not in the list (searched by its own words).
export function findWord(text: string): SearchWord | undefined {
  const t = ` ${text.toLowerCase().replace(/[-,.]/g, ' ').replace(/\s+/g, ' ').trim()} `;
  return WORD_LIST.find(([typed]) => t.includes(` ${typed} `))?.[1];
}

export function wordById(id: string | null | undefined): SearchWord | undefined {
  return id ? WORDS.find((w) => w.id === id) : undefined;
}
