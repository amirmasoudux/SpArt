// Fills MongoDB with the demo data. Run: npm run seed (needs MONGO_URI in .env).
import 'dotenv/config';
import mongoose from 'mongoose';
import { CategoryModel, OfferModel, ProductModel, ProspektOfferModel, StoreModel } from '../src/models.js';
import { loadDemoData } from '../src/repo.js';

const uri = process.env.MONGO_URI ?? process.env.MONGODB_URI;
if (!uri) {
  console.error('Set MONGO_URI in server/.env first.');
  process.exit(1);
}

const { categories, stores, products, offers, prospekt } = loadDemoData();
await mongoose.connect(uri, { dbName: 'spart' });

const toDocs = <T extends { id: string }>(rows: T[]) => rows.map(({ id, ...rest }) => ({ _id: id, ...rest }));

await Promise.all([
  CategoryModel.deleteMany({}),
  StoreModel.deleteMany({}),
  ProductModel.deleteMany({}),
  OfferModel.deleteMany({}),
  ProspektOfferModel.deleteMany({}),
]);
await CategoryModel.insertMany(toDocs(categories));
await StoreModel.insertMany(toDocs(stores));
await ProductModel.insertMany(toDocs(products));
await OfferModel.insertMany(toDocs(offers));
await ProspektOfferModel.insertMany(toDocs(prospekt));

console.log(
  `Seeded ${categories.length} categories, ${stores.length} stores, ${products.length} products, ${offers.length} offers, ${prospekt.length} Prospekt offers.`,
);
await mongoose.disconnect();
