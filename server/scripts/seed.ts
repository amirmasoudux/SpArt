// Fills MongoDB with the data files. Run: npm run seed (needs MONGO_URI in .env).
import 'dotenv/config';
import mongoose from 'mongoose';
import { CategoryModel, ProspektOfferModel, StoreModel } from '../src/models.js';
import { loadData } from '../src/repo.js';

const uri = process.env.MONGO_URI ?? process.env.MONGODB_URI;
if (!uri) {
  console.error('Set MONGO_URI in server/.env first.');
  process.exit(1);
}

const { categories, stores, prospekt } = loadData();
await mongoose.connect(uri, { dbName: 'spart' });

const toDocs = <T extends { id: string }>(rows: T[]) => rows.map(({ id, ...rest }) => ({ _id: id, ...rest }));

await Promise.all([CategoryModel.deleteMany({}), StoreModel.deleteMany({}), ProspektOfferModel.deleteMany({})]);
await CategoryModel.insertMany(toDocs(categories));
await StoreModel.insertMany(toDocs(stores));
await ProspektOfferModel.insertMany(toDocs(prospekt));

console.log(`Seeded ${categories.length} categories, ${stores.length} stores, ${prospekt.length} Prospekt offers.`);
await mongoose.disconnect();
