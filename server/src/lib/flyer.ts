// Turning Prospekt page images into offers with AI. Each step is a small function, so it can be tested alone.
// The result is the same as the kaufDA lists: data/prospekt/<chain>.txt, one line per offer.
import { askForJson } from '../ai.js';
import { FlyerPage, type FlyerOffer } from '../schemas.js';

export const FLYER_PROMPT = `You read German supermarket flyers (Prospekte).
List every product offer on this page. For each offer give:
- product: the product name as printed (brand + name), e.g. "Weihenstephan H-Milch 1,5%"
- price: the offer price in euros as a number, e.g. 0.99
- regularPrice: the crossed-out normal price if shown, else null
- unit: the size or amount as printed, e.g. "1 l", "400 g", "je 500-g-Packung", else null
Only list real offers with a price. Do not guess prices you cannot read.`;

const FLYER_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['offers'],
  properties: {
    offers: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['product', 'price', 'regularPrice', 'unit'],
        properties: {
          product: { type: 'string' },
          price: { type: 'number' },
          regularPrice: { type: ['number', 'null'] },
          unit: { type: ['string', 'null'] },
        },
      },
    },
  },
};

// Step 1: one page image → raw offers from the AI (checked by Zod inside askForJson).
export async function readFlyerPage(imageDataUrl: string): Promise<FlyerOffer[]> {
  const page = await askForJson({
    system: FLYER_PROMPT,
    text: 'Read the offers on this Prospekt page.',
    imageDataUrls: [imageDataUrl],
    schema: FlyerPage,
    jsonSchema: FLYER_JSON_SCHEMA,
  });
  return page.offers;
}

export interface ImportResult {
  lines: string[]; // "title | price | regular price | unit", the format of data/prospekt/<chain>.txt
  invalid: number; // rows Zod rejected
}

// Step 2: raw AI rows → Prospekt lines. Every offer is kept: no product list, no matching.
export function toProspektLines(raw: unknown[]): ImportResult {
  const lines: string[] = [];
  let invalid = 0;
  for (const row of raw) {
    const checked = FlyerPage.shape.offers.element.safeParse(row);
    if (!checked.success) {
      invalid++;
      continue;
    }
    const o: FlyerOffer = checked.data;
    const clean = (t: string) => t.replace(/\|/g, '/').trim();
    const line = `${clean(o.product)} | ${o.price.toFixed(2)} | ${o.regularPrice ? o.regularPrice.toFixed(2) : ''} | ${o.unit ? clean(o.unit) : ''}`;
    if (!lines.includes(line)) lines.push(line);
  }
  return { lines, invalid };
}
