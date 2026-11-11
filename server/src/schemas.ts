// Zod schemas: the one place that says what correct data looks like.
// They check everything that comes from outside: requests, the AI, the database seed.
import { z } from 'zod';

export const Chain = z.enum(['rewe', 'lidl', 'aldi', 'kaufland', 'penny', 'netto']);
export type Chain = z.infer<typeof Chain>;

export const Category = z.object({
  id: z.string(),
  label: z.string(),
  order: z.number(),
});
export type Category = z.infer<typeof Category>;

export const Store = z.object({
  id: z.string(),
  chain: Chain,
  name: z.string(),
  takesGlassBottles: z.boolean(),
});
export type Store = z.infer<typeof Store>;

export const Product = z.object({
  id: z.string(),
  name: z.string(),
  unit: z.string(),
  category: z.string(),
  prices: z.record(Chain, z.number().positive()),
});
export type Product = z.infer<typeof Product>;

export const Offer = z.object({
  id: z.string(),
  chain: Chain,
  productId: z.string(),
  price: z.number().positive(),
  validFrom: z.coerce.date(),
  validTo: z.coerce.date(),
  source: z.string().optional(), // e.g. "REWE Prospekt KW 46, page 3"
});
export type Offer = z.infer<typeof Offer>;

// What the app sends to get a plan.
export const PlanRequest = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        qty: z.number().int().min(1).max(20),
        productId: z.string().nullable(),
      }),
    )
    .min(1)
    .max(100),
});
export type PlanRequest = z.infer<typeof PlanRequest>;

// One offer as the AI reads it from a Prospekt page.
export const FlyerOffer = z.object({
  product: z.string().min(1),
  price: z.number().positive(),
  regularPrice: z.number().positive().nullable().optional(),
  unit: z.string().nullable().optional(),
});
export const FlyerPage = z.object({ offers: z.array(FlyerOffer) });
export type FlyerOffer = z.infer<typeof FlyerOffer>;
