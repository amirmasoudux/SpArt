// The Express app: all API routes.
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { ZodError } from 'zod';
import { aiConfigured } from './ai.js';
import { matchWithAi } from './lib/aiMatch.js';
import { makeMealPlan } from './lib/meals.js';
import { ALIASES } from './lib/match.js';
import { rankStores } from './lib/plan.js';
import { findOffers } from './lib/search.js';
import type { Repo } from './repo.js';
import { MatchRequest, MealPlanRequest, PlanRequest, ReportRequest } from './schemas.js';

export function createApp(repo: Repo, clientUrl = '*') {
  const app = express();
  app.use(cors({ origin: clientUrl }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  // Catalog: what the app needs to understand a list.
  app.get('/api/catalog', async (_req, res, next) => {
    try {
      const [categories, stores, products] = await Promise.all([repo.categories(), repo.stores(), repo.products()]);
      res.json({ categories, stores, products });
    } catch (err) {
      next(err);
    }
  });

  // This week's offers.
  app.get('/api/offers', async (_req, res, next) => {
    try {
      res.json(await repo.currentOffers());
    } catch (err) {
      next(err);
    }
  });

  // The main feature: list in, stores ranked by price out.
  app.post('/api/plan', async (req, res, next) => {
    try {
      const { items } = PlanRequest.parse(req.body);
      const [stores, products, offers, prospekt] = await Promise.all([
        repo.stores(),
        repo.products(),
        repo.currentOffers(),
        repo.prospektOffers(),
      ]);
      const storeName = (chain: string) => stores.find((s) => s.chain === chain)?.name ?? chain;
      // For every item: all Prospekt offers that match its name, also outside our catalog.
      const itemOffers = items
        .map((item) => ({
          itemId: item.id,
          name: item.name,
          offers: findOffers(item.name, prospekt, item.productId ? ALIASES[item.productId] ?? [] : []).map((o) => ({
            chain: o.chain,
            storeName: storeName(o.chain),
            title: o.title,
            price: o.price,
            regularPrice: o.regularPrice,
            unitInfo: o.unitInfo,
          })),
        }))
        .filter((i) => i.offers.length > 0);
      res.json({
        plans: rankStores(items, stores, products, offers),
        offerCount: offers.length + prospekt.length,
        itemOffers,
      });
    } catch (err) {
      next(err);
    }
  });

  // Search this week's Prospekte by name: /api/prospekt/search?q=toffifee
  app.get('/api/prospekt/search', async (req, res, next) => {
    try {
      const q = String(req.query.q ?? '').slice(0, 60);
      res.json({ offers: findOffers(q, await repo.prospektOffers(), [], 20) });
    } catch (err) {
      next(err);
    }
  });

  // Words the simple parser did not know → ask the AI which product they are.
  app.post('/api/items/match', async (req, res, next) => {
    try {
      const { names } = MatchRequest.parse(req.body);
      const matches = await matchWithAi(names, await repo.products());
      res.json({ matches, aiUsed: aiConfigured() });
    } catch (err) {
      next(err);
    }
  });

  // "Tell me what to buy": 4 answers → meal plan with ingredients.
  app.post('/api/meal-plan', async (req, res, next) => {
    try {
      const answers = MealPlanRequest.parse(req.body);
      res.json(await makeMealPlan(answers, await repo.products()));
    } catch (err) {
      next(err);
    }
  });

  // A user tells us a price or offer is wrong.
  app.post('/api/reports', async (req, res, next) => {
    try {
      const report = await repo.addReport(ReportRequest.parse(req.body));
      res.status(201).json({ id: report.id });
    } catch (err) {
      next(err);
    }
  });

  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

  // One place for errors: bad input → 400, everything else → 500.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Invalid request', details: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`) });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  });

  return app;
}
