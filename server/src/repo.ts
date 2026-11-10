// Data access. The routes only talk to this interface, so they don't care
// whether the data comes from MongoDB or from the demo files in memory.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CategoryModel, OfferModel, ProductModel, StoreModel } from './models.js';
import { Category, Offer, Product, Store } from './schemas.js';
import { endOfDay, weekdayToDate } from './lib/week.js';

export interface Repo {
  categories(): Promise<Category[]>;
  stores(): Promise<Store[]>;
  products(): Promise<Product[]>;
  currentOffers(today?: Date): Promise<Offer[]>;
  replaceOffers(chain: Store['chain'], offers: Offer[]): Promise<void>;
}

const dataDir = fileURLToPath(new URL('../data/', import.meta.url));
const readJson = (name: string): unknown => JSON.parse(readFileSync(dataDir + name, 'utf8'));

// Demo data, checked with Zod so a typo in a JSON file fails loudly.
export function loadDemoData(today = new Date(), opts = { imported: true }) {
  const categories = Category.array().parse(readJson('categories.json'));
  const stores = Store.array().parse(readJson('stores.json'));
  const products = Product.array().parse(readJson('products.json'));
  const rawOffers = readJson('offers.json') as { validFrom: string; validTo: string }[];
  const offers = Offer.array().parse(
    rawOffers.map((o) => ({
      ...o,
      validFrom: weekdayToDate(o.validFrom, today),
      validTo: endOfDay(weekdayToDate(o.validTo, today)),
      source: 'Demo data',
    })),
  );
  return { categories, stores, products, offers: opts.imported ? withImportedOffers(offers) : offers };
}

// Real offers from Prospekte (written by `npm run import-flyer -- ... --out`) replace
// the demo offers of that chain. One file per chain in data/imported/.
function withImportedOffers(demo: Offer[]): Offer[] {
  const dir = dataDir + 'imported/';
  if (!existsSync(dir)) return demo;
  let offers = demo;
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const imported = Offer.array().parse(JSON.parse(readFileSync(dir + file, 'utf8')));
    const chains = new Set(imported.map((o) => o.chain));
    offers = [...offers.filter((o) => !chains.has(o.chain)), ...imported];
  }
  return offers;
}

const isCurrent = (o: Offer, today: Date) => o.validFrom <= today && today <= o.validTo;

export function memoryRepo(): Repo {
  const data = loadDemoData();
  return {
    categories: async () => data.categories,
    stores: async () => data.stores,
    products: async () => data.products,
    currentOffers: async (today = new Date()) => data.offers.filter((o) => isCurrent(o, today)),
    replaceOffers: async (chain, offers) => {
      data.offers = [...data.offers.filter((o) => o.chain !== chain), ...offers];
    },
  };
}

// Mongo documents use _id; the app uses id.
const withId = <T extends { _id: unknown }>(doc: T) => {
  const { _id, ...rest } = doc;
  return { id: String(_id), ...rest };
};

export function mongoRepo(): Repo {
  return {
    categories: async () => Category.array().parse((await CategoryModel.find().sort({ order: 1 }).lean()).map(withId)),
    stores: async () => Store.array().parse((await StoreModel.find().lean()).map(withId)),
    products: async () =>
      Product.array().parse(
        (await ProductModel.find().lean()).map((p) => ({ ...withId(p), prices: Object.fromEntries(Object.entries(p.prices ?? {})) })),
      ),
    currentOffers: async (today = new Date()) =>
      Offer.array().parse((await OfferModel.find({ validFrom: { $lte: today }, validTo: { $gte: today } }).lean()).map(withId)),
    replaceOffers: async (chain, offers) => {
      await OfferModel.deleteMany({ chain });
      await OfferModel.insertMany(offers.map(({ id, ...o }) => ({ _id: id, ...o })));
    },
  };
}
