// Weekly job: turn Prospekt pages into offers in the database.
//
// Real run (needs AI_API_KEY, and MONGO_URI to save):
//   npm run import-flyer -- --chain rewe --from 2026-11-16 --to 2026-11-21 page1.png page2.png
//
// Practice run without AI (uses a saved AI answer):
//   npm run import-flyer -- --chain rewe --from 2026-11-16 --to 2026-11-21 --sample scripts/sample-flyer-answer.json
//
// Add --dry-run to only print the result and save nothing.
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
import mongoose from 'mongoose';
import { parseArgs } from 'node:util';
import { readFlyerPage, toOffers } from '../src/lib/flyer.js';
import { endOfDay } from '../src/lib/week.js';
import { loadDemoData, mongoRepo } from '../src/repo.js';
import { Chain } from '../src/schemas.js';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    chain: { type: 'string' },
    from: { type: 'string' },
    to: { type: 'string' },
    sample: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
  },
});

const chain = Chain.parse(values.chain);
if (!values.from || !values.to) throw new Error('Give --from and --to dates, e.g. --from 2026-11-16 --to 2026-11-21');
const week = { from: new Date(`${values.from}T00:00:00`), to: endOfDay(new Date(`${values.to}T00:00:00`)) };

// 1) Get the raw offers: from the AI, or from a saved sample answer.
let raw: unknown[] = [];
if (values.sample) {
  raw = (JSON.parse(readFileSync(values.sample, 'utf8')) as { offers: unknown[] }).offers;
  console.log(`Using sample answer: ${raw.length} rows`);
} else {
  if (positionals.length === 0) throw new Error('Give one or more page images (png/jpg/webp).');
  for (const file of positionals) {
    const type = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }[extname(file).toLowerCase()];
    if (!type) throw new Error(`Not an image: ${file}`);
    const dataUrl = `data:${type};base64,${readFileSync(file).toString('base64')}`;
    const pageOffers = await readFlyerPage(dataUrl);
    console.log(`${file}: AI found ${pageOffers.length} offers`);
    raw.push(...pageOffers);
  }
}

// 2) Check, link to products, keep real savings.
const { products } = loadDemoData();
const result = toOffers(raw, chain, products, week, `${chain.toUpperCase()} Prospekt ${values.from}`);

console.log(`\n✔ ${result.offers.length} offers ready`);
for (const o of result.offers) console.log(`  ${o.productId.padEnd(24)} €${o.price.toFixed(2)}`);
if (result.unmatched.length) {
  console.log(`\n? ${result.unmatched.length} offers not in our catalog (not saved):`);
  for (const u of result.unmatched) console.log(`  ${u.product} €${u.price}`);
}
if (result.invalid) console.log(`\n✘ ${result.invalid} rows rejected by Zod`);

// 3) Save (replaces this chain's old offers).
if (values['dry-run']) {
  console.log('\nDry run: nothing saved.');
} else if (!process.env.MONGO_URI) {
  console.log('\nNo MONGO_URI: nothing saved. Add it to server/.env to save offers.');
} else {
  await mongoose.connect(process.env.MONGO_URI);
  await mongoRepo().replaceOffers(chain, result.offers);
  await mongoose.disconnect();
  console.log(`\nSaved ${result.offers.length} ${chain} offers to MongoDB.`);
}
