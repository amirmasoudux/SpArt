// The Express app: all API routes.
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { ZodError } from 'zod';
import { aiConfigured } from './ai.js';
import { matchWithAi } from './lib/aiMatch.js';
import { makeMealPlan } from './lib/meals.js';
import { rankStores } from './lib/plan.js';
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
      const [stores, products, offers] = await Promise.all([repo.stores(), repo.products(), repo.currentOffers()]);
      res.json({ plans: rankStores(items, stores, products, offers), offerCount: offers.length });
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
