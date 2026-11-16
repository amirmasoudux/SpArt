// Starts the server. With MONGO_URI it uses MongoDB, without it the data files in memory.
import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { loadDemoData, memoryRepo, mongoRepo } from './repo.js';
import { OfferModel, ProductModel, ProspektOfferModel } from './models.js';

const port = Number(process.env.PORT ?? 4000);
// MONGO_URI is our name; MONGODB_URI is the name in the .env file Atlas lets you download.
const mongoUri = process.env.MONGO_URI ?? process.env.MONGODB_URI;

async function start() {
  let repo;
  if (mongoUri) {
    await mongoose.connect(mongoUri, { dbName: 'spart' });
    console.log('Connected to MongoDB');
    // The data files are the source: on every start, products (normal prices) and offers in MongoDB
    // are replaced with the files — last week's offers are deleted and this week's are copied in,
    // so a new deploy brings the new week.
    const { prospekt, offers, products } = loadDemoData();
    await ProductModel.deleteMany({});
    await ProductModel.insertMany(products.map(({ id, ...p }) => ({ _id: id, ...p })));
    await ProspektOfferModel.deleteMany({});
    await ProspektOfferModel.insertMany(prospekt.map(({ id, ...o }) => ({ _id: id, ...o })));
    await OfferModel.deleteMany({});
    await OfferModel.insertMany(offers.map(({ id, ...o }) => ({ _id: id, ...o })));
    console.log(`Loaded ${products.length} products, ${prospekt.length} Prospekt offers and ${offers.length} matched offers into MongoDB`);
    repo = mongoRepo();
  } else {
    console.log('No MONGO_URI set: using the data files in memory');
    repo = memoryRepo();
  }
  createApp(repo, process.env.CLIENT_URL || '*').listen(port, () => console.log(`SpArt API on http://localhost:${port}`));
}

start().catch((err) => {
  console.error('Server could not start:', err);
  process.exit(1);
});
