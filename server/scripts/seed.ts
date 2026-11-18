// Fills MongoDB with the data files. Run: npm run seed (needs MONGO_URI in .env).
import 'dotenv/config';
import mongoose from 'mongoose';
import { CategoryModel, NormalPriceModel, ProspektOfferModel, StoreModel } from '../src/models.js';
import { loadData } from '../src/repo.js';

const uri = process.env.MONGO_URI ?? process.env.MONGODB_URI;
if (!uri) {
  console.error('Set MONGO_URI in server/.env first.');
  process.exit(1);
}

const { categories, stores, prospekt, normal } = loadData();
await mongoose.connect(uri, { dbName: 'spart' });

const toDocs = <T extends { id: string }>(rows: T[]) => rows.map(({ id, ...rest }) => ({ _id: id, ...rest }));

await Promise.all([CategoryModel.deleteMany({}), StoreModel.deleteMany({}), ProspektOfferModel.deleteMany({}), NormalPriceModel.deleteMany({})]);
await CategoryModel.insertMany(toDocs(categories));
await StoreModel.insertMany(toDocs(stores));
await ProspektOfferModel.insertMany(toDocs(prospekt));
await NormalPriceModel.insertMany(normal);

console.log(`Seeded ${categories.length} categories, ${stores.length} stores, ${prospekt.length} Prospekt offers, ${normal.length} normal prices.`);
await mongoose.disconnect();
