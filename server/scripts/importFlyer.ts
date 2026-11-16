// Weekly job with AI: read Prospekt page images and write the offers to data/prospekt/<chain>.txt
// (the same file the kaufDA lists go to). The server loads it into MongoDB on the next start.
//
// Real run (needs AI_API_KEY):
//   npm run import-flyer -- --chain rewe page1.png page2.png
//
// Practice run without AI (uses a saved AI answer):
//   npm run import-flyer -- --chain rewe --sample scripts/sample-flyer-answer.json
//
// Add --dry-run to only print the result and save nothing.
import 'dotenv/config';
import { readFileSync, writeFileSync } from 'node:fs';
import { extname } from 'node:path';
import { parseArgs } from 'node:util';
import { readFlyerPage, toProspektLines } from '../src/lib/flyer.js';
import { Chain } from '../src/schemas.js';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    chain: { type: 'string' },
    sample: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
  },
});

const chain = Chain.parse(values.chain);

// 1) Get the raw offers: from the AI, or from a saved sample answer.
let raw: unknown[] = [];
let source = `${chain.toUpperCase()} Prospekt`;
if (values.sample) {
  const file = JSON.parse(readFileSync(values.sample, 'utf8')) as { offers: unknown[]; source?: string };
  raw = file.offers;
  if (file.source) source = file.source;
  console.log(`Using saved answer: ${raw.length} rows`);
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

// 2) Check every row with Zod and turn it into a Prospekt line.
const { lines, invalid } = toProspektLines(raw);
console.log(`\n✔ ${lines.length} offers`);
for (const l of lines) console.log(`  ${l}`);
if (invalid) console.log(`\n✘ ${invalid} rows rejected by Zod`);

// 3) Save (replaces this chain's list). Set the week in src/lib/prospekt.ts (PROSPEKT_WEEK).
if (values['dry-run']) {
  console.log('\nDry run: nothing saved.');
} else {
  const file = new URL(`../data/prospekt/${chain}.txt`, import.meta.url);
  writeFileSync(file, `# ${source}\n${lines.join('\n')}\n`);
  console.log(`\nSaved ${lines.length} ${chain} offers to data/prospekt/${chain}.txt`);
}
