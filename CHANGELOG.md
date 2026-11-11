# Changelog

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

**Real Lidl prices**
- Lidl normal prices for milk, bananas, basmati rice, potatoes and cucumber now come from real Lidl Plus receipts (Lidl Siegburg, latest purchase of each item, 2025–2026)
- REWE normal prices for 23 products now come from the REWE online shop (PETZ REWE Siegburg, pickup prices, 10.11.2026)
- Demo offers: every product is on offer in at least one store, valid every day
- Real ALDI SÜD offers (9.–14.11.2026) from aldi-sued.de: apples, onions, orange juice; ALDI butter normal price 1.15 (permanent price)
- New stores: Kaufland, Penny and Netto (6 supermarkets now), with this week's Siegburg offers from their Prospekte; price sources in `server/data/PRICES.md`

## v0.1 · Week 1

- Project setup: Vite, React, TypeScript, Tailwind, React Router
- Data model (`types.ts`) and demo data
- Write a list in normal words → items with categories
- Check the list: change quantities, rename, remove with a confirm step
- Lists saved in the browser (localStorage), no login
