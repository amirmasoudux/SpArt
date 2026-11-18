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

// One offer from a Prospekt ("Toffifee", "Rinderhackfleisch"). The app searches these by name
// for every item on a list. This is the only price data SpArt has: real offers of this week.
export const ProspektOffer = z.object({
  id: z.string(),
  chain: Chain,
  title: z.string().min(1),
  price: z.number().positive(),
  regularPrice: z.number().positive().nullable(),
  unitInfo: z.string().nullable(), // e.g. "1 kg = 7.45", "ab", "500 g"
  validFrom: z.coerce.date(),
  validTo: z.coerce.date(),
  source: z.string(),
});
export type ProspektOffer = z.infer<typeof ProspektOffer>;

// A normal (not discounted) price of one store, for items that are not on offer this week.
// Real data only: ALDI SÜD website, REWE online shop (Siegburg) or Open Prices (receipts and shelf labels).
export const NormalPrice = z.object({
  wordId: z.string(), // search word, see lib/words.ts
  chain: Chain,
  price: z.number().positive(),
  size: z.string(), // "500 g", "1 l", "pack"
  title: z.string(),
  source: z.string(),
  date: z.string(), // when the price was seen, YYYY-MM-DD
});
export type NormalPrice = z.infer<typeof NormalPrice>;

// What the app sends to get a plan.
export const PlanRequest = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        qty: z.number().int().min(1).max(20),
        wordId: z.string().nullable(), // see lib/words.ts; null = searched by its own words
      }),
    )
    .min(1)
    .max(100),
  // The supermarkets the user goes to. Missing = all six.
  chains: z.array(z.enum(['rewe', 'lidl', 'aldi', 'kaufland', 'penny', 'netto'])).min(1).max(6).optional(),
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

// A user report about wrong data ("the price is different in the store").
export const ReportRequest = z.object({
  offerTitle: z.string().max(200), // the Prospekt offer the user means
  storeId: z.string(),
  kind: z.enum(['wrong_price', 'offer_ended', 'not_in_store', 'other']),
  correctPrice: z.number().positive().nullable().optional(),
  note: z.string().max(300).optional(),
});
export type ReportRequest = z.infer<typeof ReportRequest>;
export interface Report extends ReportRequest {
  id: string;
  createdAt: Date;
}

// Item names the simple parser did not find in the search words ("banans", "Haferdrink").
// The AI tries to link them to a search word.
export const MatchRequest = z.object({ names: z.array(z.string().min(1).max(80)).min(1).max(30) });
export const MatchAnswer = z.object({
  matches: z.array(z.object({ name: z.string(), wordId: z.string().nullable() })),
});

