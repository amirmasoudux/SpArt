// Data access. The routes only talk to this interface, so they don't care
// whether the data comes from MongoDB or from the data files in memory.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { CategoryModel, NormalPriceModel, ProspektOfferModel, ReportModel, StoreModel } from './models.js';
import { Category, NormalPrice, ProspektOffer, Store, type Report, type ReportRequest } from './schemas.js';
import { loadProspektOffers } from './lib/prospekt.js';

export interface Repo {
  categories(): Promise<Category[]>;
  stores(): Promise<Store[]>;
  // Every offer of this week's Prospekte: the only price data we have.
  prospektOffers(today?: Date): Promise<ProspektOffer[]>;
  // Normal prices for items without an offer (ALDI website, REWE shop, Open Prices).
  normalPrices(): Promise<NormalPrice[]>;
  addReport(report: ReportRequest): Promise<Report>;
}

const dataDir = fileURLToPath(new URL('../data/', import.meta.url));
const readJson = (name: string): unknown => JSON.parse(readFileSync(dataDir + name, 'utf8'));

// The data files, checked with Zod so a typo in a file fails loudly.
// Prices: this week's real Prospekt offers (data/prospekt/<chain>.txt) and real normal prices (data/prices.json).
export function loadData() {
  const categories = Category.array().parse(readJson('categories.json'));
  const stores = Store.array().parse(readJson('stores.json'));
  const prospekt = loadProspektOffers(dataDir + 'prospekt/');
  const normal = NormalPrice.array().parse(readJson('prices.json'));
  return { categories, stores, prospekt, normal };
}

const isCurrent = (o: { validFrom: Date; validTo: Date }, today: Date) => o.validFrom <= today && today <= o.validTo;

export function memoryRepo(): Repo {
  const data = loadData();
  const reports: Report[] = [];
  return {
    categories: async () => data.categories,
    stores: async () => data.stores,
    prospektOffers: async (today = new Date()) => data.prospekt.filter((o) => isCurrent(o, today)),
    normalPrices: async () => data.normal,
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
    prospektOffers: async (today = new Date()) =>
      ProspektOffer.array().parse(
        (await ProspektOfferModel.find({ validFrom: { $lte: today }, validTo: { $gte: today } }).lean()).map(withId),
      ),
    normalPrices: async () => NormalPrice.array().parse(await NormalPriceModel.find({}, { _id: 0, __v: 0 }).lean()),
    addReport: async (report) => {
      const id = randomUUID();
      const doc = await ReportModel.create({ _id: id, ...report });
      return { ...report, id, createdAt: doc.get('createdAt') as Date };
    },
  };
}
