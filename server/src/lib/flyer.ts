// Turning one Prospekt into offers. Each step is a small function, so it can be tested alone.
import { askForJson } from '../ai.js';
import { FlyerPage, Offer, type Chain, type FlyerOffer, type Product } from '../schemas.js';
import { matchProduct } from './match.js';

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

// "400 g", "1 l", "1,5 kg", "je 500-g-Packung" → amount in g / ml / pieces. null if unreadable.
export function parseAmount(unit: string | null | undefined): { value: number; base: 'g' | 'ml' | 'pcs' } | null {
  if (!unit) return null;
  const m = unit.toLowerCase().replace(',', '.').match(/(\d+(?:\.\d+)?)\s*-?\s*(kg|g|l|ml|stück|stk|pcs|rolls|rollen)\b/);
  if (!m) return null;
  const n = Number(m[1]);
  switch (m[2]) {
    case 'kg': return { value: n * 1000, base: 'g' };
    case 'g': return { value: n, base: 'g' };
    case 'l': return { value: n * 1000, base: 'ml' };
    case 'ml': return { value: n, base: 'ml' };
    default: return { value: n, base: 'pcs' };
  }
}

// The flyer may sell a different size than our product (200 g instead of 400 g).
// Scale the price to our product's size, so prices compare fairly.
export function priceForProductSize(price: number, flyerUnit: string | null | undefined, productUnit: string): number {
  const flyer = parseAmount(flyerUnit);
  const ours = parseAmount(productUnit);
  if (!flyer || !ours || flyer.base !== ours.base || flyer.value === 0) return price;
  return Math.round(price * (ours.value / flyer.value) * 100) / 100;
}

export interface ImportResult {
  offers: Offer[];
  unmatched: FlyerOffer[]; // offers we could not link to a product (logged, not saved)
  invalid: number; // rows Zod rejected
}

// Step 2: raw offers → our offers. Check each row, link it to a product, keep only real savings.
export function toOffers(
  raw: unknown[],
  chain: Chain,
  products: Product[],
  week: { from: Date; to: Date },
  source: string,
): ImportResult {
  const offers: Offer[] = [];
  const unmatched: FlyerOffer[] = [];
  let invalid = 0;

  for (const row of raw) {
    const checked = FlyerPage.shape.offers.element.safeParse(row);
    if (!checked.success) {
      invalid++;
      continue;
    }
    const flyerOffer = checked.data;
    const product = matchProduct(flyerOffer.product, products);
    if (!product) {
      unmatched.push(flyerOffer);
      continue;
    }
    const price = priceForProductSize(flyerOffer.price, flyerOffer.unit, product.unit);
    // Only keep it if the offer is cheaper than our normal price for that chain.
    const regular = product.prices[chain];
    if (regular !== undefined && price >= regular) continue;
    // Same product twice on the flyer: keep the cheaper one.
    const existing = offers.find((o) => o.productId === product.id);
    if (existing) {
      existing.price = Math.min(existing.price, price);
      continue;
    }
    offers.push(
      Offer.parse({
        id: `${chain}-${product.id}-${week.from.toISOString().slice(0, 10)}`,
        chain,
        productId: product.id,
        price,
        validFrom: week.from,
        validTo: week.to,
        source,
      }),
    );
  }
  return { offers, unmatched, invalid };
}
