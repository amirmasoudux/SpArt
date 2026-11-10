// Zod schemas: the one place that says what correct data looks like.
// They check everything that comes from outside: requests, the AI, the database seed.
import { z } from 'zod';

export const Chain = z.enum(['rewe', 'lidl', 'aldi']);
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

// A user report about wrong data ("the price is different in the store").
export const ReportRequest = z.object({
  productId: z.string(),
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

// Item names the simple parser could not match. The AI tries to link them to products.
export const MatchRequest = z.object({ names: z.array(z.string().min(1).max(80)).min(1).max(30) });
export const MatchAnswer = z.object({
  matches: z.array(z.object({ name: z.string(), productId: z.string().nullable() })),
});

// "Tell me what to buy": the 4 questions.
export const MealPlanRequest = z.object({
  days: z.number().int().min(1).max(7),
  mealsPerDay: z.number().int().min(1).max(3),
  cook: z.enum(['quick', 'normal', 'love']),
  avoid: z.array(z.enum(['meat', 'pork', 'fish', 'dairy'])).default([]),
});
export type MealPlanRequest = z.infer<typeof MealPlanRequest>;
export const MealPlan = z.object({
  meals: z.array(z.object({ day: z.string(), name: z.string(), ingredients: z.array(z.string()).min(1) })).min(1),
});
export type MealPlan = z.infer<typeof MealPlan>;
