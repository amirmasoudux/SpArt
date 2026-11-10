# Changelog

## v0.3 · Week 3

**New features**
- "Tell me what to buy": 4 questions → meal plan → shopping list (AI plans the meals; our own recipes when no AI key is set)
- AI helps with unknown words: typed items the word list does not know are sent to the AI, which links them to products (made-up ids are rejected)
- "Wrong price?" on the plan: users report wrong prices, ended offers or missing products
- New API routes: `POST /api/items/match`, `POST /api/meal-plan`, `POST /api/reports`

**Design**
- Final design from the prototype: Manrope font, violet primary buttons, cards, bottom sheets, Prospekte check animation, counting saving on "Trip done"

**Quality and deploy**
- 18 server tests, including the AI path with a fake AI answer
- `render.yaml` for the backend on Render; frontend ready for Vercel (`VITE_API_URL`)

**Real Lidl prices**
- Lidl normal prices for milk, bananas, basmati rice, potatoes and cucumber now come from real Lidl Plus receipts (Lidl Siegburg, latest purchase of each item, 2025–2026)
- REWE normal prices for 23 products now come from the REWE online shop (PETZ REWE Siegburg, pickup prices, 10.11.2026)
- Demo offers: every product is on offer in at least one store, valid every day

## v0.2 · Week 2 (MVP)

**Backend (new `server/` folder)**
- Express API: `GET /api/health`, `GET /api/catalog`, `GET /api/offers`, `POST /api/plan`
- MongoDB with Mongoose models (categories, stores, products, offers); demo data in memory when no database is set
- Zod checks every request and all data from files, the database and the AI
- Seed script for MongoDB
- Prospekt import: AI reads flyer pages → Zod check → sizes made comparable → linked to our products → saved
- **Real offers:** REWE and Lidl Prospekte for Siegburg (9.–14.11.2026), read from kaufDA and imported with `--out`. Aldi is not on kaufDA for Siegburg, so it stays on demo data.
- Found and fixed wrong matches from the real import (Lauchzwiebeln ≠ onions, Milchreis ≠ rice)
- Tests for the plan logic, the Prospekt import and the API

**Frontend**
- After checking the list: "Checking this week's Prospekte" → plan with the cheapest store and the saving
- Shopping checklist grouped by category
- Trip saved, plus a Savings tab
- Uses the API, with demo data as a backup when the server is not running

## v0.1 · Week 1

- Project setup: Vite, React, TypeScript, Tailwind, React Router
- Data model (`types.ts`) and demo data
- Write a list in normal words → items with categories
- Check the list: change quantities, rename, remove with a confirm step
- Lists saved in the browser (localStorage), no login
