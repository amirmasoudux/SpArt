// Data access. The routes only talk to this interface, so they don't care
// whether the data comes from MongoDB or from the demo files in memory.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { CategoryModel, OfferModel, ProductModel, ProspektOfferModel, ReportModel, StoreModel } from './models.js';
import { Category, Offer, Product, ProspektOffer, Store, type Report, type ReportRequest } from './schemas.js';
import { loadProspektOffers } from './lib/prospekt.js';

export interface Repo {
  categories(): Promise<Category[]>;
  stores(): Promise<Store[]>;
  products(): Promise<Product[]>;
  currentOffers(today?: Date): Promise<Offer[]>;
  // Every offer of this week's Prospekte, also for things outside the catalog.
  prospektOffers(today?: Date): Promise<ProspektOffer[]>;
  replaceOffers(chain: Store['chain'], offers: Offer[]): Promise<void>;
  addReport(report: ReportRequest): Promise<Report>;
}

const dataDir = fileURLToPath(new URL('../data/', import.meta.url));
const readJson = (name: string): unknown => JSON.parse(readFileSync(dataDir + name, 'utf8'));

// The data files, checked with Zod so a typo in a JSON file fails loudly.
// Offers are only real ones: this week's Prospekt offers matched to our products (data/imported/).
export function loadDemoData(_today = new Date(), opts = { imported: true }) {
  const categories = Category.array().parse(readJson('categories.json'));
  const stores = Store.array().parse(readJson('stores.json'));
  const products = Product.array().parse(readJson('products.json'));
  const offers = opts.imported ? loadImportedOffers() : [];
  const prospekt = loadProspektOffers(dataDir + 'prospekt/');
  return { categories, stores, products, offers, prospekt };
}

// One file per chain in data/imported/, replaced every week.
function loadImportedOffers(): Offer[] {
  const dir = dataDir + 'imported/';
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .flatMap((file) => Offer.array().parse(JSON.parse(readFileSync(dir + file, 'utf8'))));
}

const isCurrent = (o: { validFrom: Date; validTo: Date }, today: Date) => o.validFrom <= today && today <= o.validTo;

export function memoryRepo(): Repo {
  const data = loadDemoData();
  const reports: Report[] = [];
  return {
    categories: async () => data.categories,
    stores: async () => data.stores,
    products: async () => data.products,
    currentOffers: async (today = new Date()) => data.offers.filter((o) => isCurrent(o, today)),
    prospektOffers: async (today = new Date()) => data.prospekt.filter((o) => isCurrent(o, today)),
    replaceOffers: async (chain, offers) => {
      data.offers = [...data.offers.filter((o) => o.chain !== chain), ...offers];
    },
    addReport: async (report) => {
      const saved = { ...report, id: randomUUID(), createdAt: new Date() };
      reports.push(saved);
      return saved;
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
    prospektOffers: async (today = new Date()) =>
      ProspektOffer.array().parse(
        (await ProspektOfferModel.find({ validFrom: { $lte: today }, validTo: { $gte: today } }).lean()).map(withId),
      ),
    replaceOffers: async (chain, offers) => {
      await OfferModel.deleteMany({ chain });
      await OfferModel.insertMany(offers.map(({ id, ...o }) => ({ _id: id, ...o })));
    },
    addReport: async (report) => {
      const id = randomUUID();
      const doc = await ReportModel.create({ _id: id, ...report });
      return { ...report, id, createdAt: doc.get('createdAt') as Date };
    },
  };
}
