// Starts the server. With MONGO_URI it uses MongoDB, without it the demo data in memory.
import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { loadDemoData, memoryRepo, mongoRepo } from './repo.js';
import { ProspektOfferModel } from './models.js';

const port = Number(process.env.PORT ?? 4000);
// MONGO_URI is our name; MONGODB_URI is the name in the .env file Atlas lets you download.
const mongoUri = process.env.MONGO_URI ?? process.env.MONGODB_URI;

async function start() {
  let repo;
  if (mongoUri) {
    await mongoose.connect(mongoUri, { dbName: 'spart' });
    console.log('Connected to MongoDB');
    // The Prospekt files in data/prospekt/ are the source for this week's full offer lists:
    // copy them into MongoDB on every start, so a new deploy brings the new week.
    const { prospekt } = loadDemoData();
    await ProspektOfferModel.deleteMany({});
    await ProspektOfferModel.insertMany(prospekt.map(({ id, ...o }) => ({ _id: id, ...o })));
    console.log(`Loaded ${prospekt.length} Prospekt offers into MongoDB`);
    repo = mongoRepo();
  } else {
    console.log('No MONGO_URI set: using demo data in memory');
    repo = memoryRepo();
  }
  createApp(repo, process.env.CLIENT_URL || '*').listen(port, () => console.log(`SpArt API on http://localhost:${port}`));
}

start().catch((err) => {
  console.error('Server could not start:', err);
  process.exit(1);
});
