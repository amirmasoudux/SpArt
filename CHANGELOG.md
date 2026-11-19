# Changelog

## Demo Day: splash screen and phone frame
- Splash screen: "SpArt · The art of Sparen" on violet when the app opens; stays 20 seconds (for the Demo Day intro), a tap skips it
- On big screens the app sits in a phone frame, with the SpArt name next to it, and a small "Let’s connect on LinkedIn" QR card under it

## Fair prices for the list amount
- When the Prospekt prints the price per kg/l, an item costs that price × the amount on the list (1.5 l from a 12-litre crate = 1.5 × price per litre), not the whole pack
- Offers without a pack size (e.g. "Gouda 5.49") are shown, but that item is left out of the store comparison

## Plan screen: supermarket slider
- One card per chosen supermarket, cheapest first, in a swipe slider (with dots); every card shows the total for your items and its own saving with offers
- The card in view is the one you shop at: the list and the "Shop at…" button follow it
- The "All your supermarkets" accordion is gone (the slider shows them all)

## Plan screen: clear hierarchy
- Top card: "Go to Kaufland", the chosen store next to the next best (same items, with bars), the main saving "You save €7.24 with offers", then one receipt line "Whole list at Kaufland (11 items) €21.89"
- The list, all supermarkets and "How we compared" (sources, method) moved into accordions
- Fixed search matches: cheese ≠ pasta, cream cheese, cheese pretzels or croissants; bread ≠ Lebkuchen

## Real money, real amounts
- Every price is now what you really pay for the amount on the list (search words have an amount: 500 g pasta, 1 l milk, 250 g cheese…), with as many packs as you need (2 × 125 g mozzarella for 250 g); a pack up to 25 % smaller counts as enough
- Offer vs. normal price: the one that costs less for that amount
- The plan shows one number: "You pay at Kaufland €13.42 · €1.61 less than at ALDI" (no more separate "same amounts" basket)
- 30 tests

## Whole basket, real normal prices
- New price database (`server/data/prices.json`, MongoDB `normal_prices`): 90 real normal prices for 6 chains, each with source and date
  - REWE: online shop of the Siegburg market (Barbarastr.), checked 10. and 18.11.2026
  - ALDI SÜD: official website, checked 18.11.2026
  - Lidl, Kaufland, Penny, Netto: Open Prices (receipts and shelf labels in Germany; Lidl/Kaufland/Penny/Netto publish no normal prices online)
- For every item and store: this week's offer, or the normal price when there is no offer or it is cheaper per kg/l (e.g. Netto's 12-litre crate)
- The stores are compared on the whole basket: only items with a price in every chosen store, same amounts (smallest known pack); washing powder, beer and toilet paper are left out (pack sizes too different)
- Unsized fresh meat/fish offers are read as "per 100 g"; fixed: Wagner "Die Backfrische Mozzarella" pizza was matched as cheese
- Plan: "Go to X · your basket €…, €… cheaper than Y", every price shows offer or normal price with its source
- Trip saving: what the same basket costs more at the next-cheapest chosen store (or the Prospekt old prices with one store)
- 29 tests; end-to-end 19 steps pass; axe: 0 problems; live test on spart-plum.vercel.app + Render/MongoDB passes

## One supermarket
- The plan recommends ONE supermarket from the ones the user picked: the most items on offer, then the biggest saving ("Go to Kaufland")
- The other picked supermarkets are shown as cards (offers + saving); tap one to see the list for that store
- Shopping checklist and trip are for that one supermarket
- Fix: lists saved before the search words existed searched "Milk" by its name and found chocolate (Alpenmilch); the search word is now found from the name
- 26 tests
- No duplicate items: "Add more items", renaming, and older lists merge the same item into one line and add up the quantity
- The chosen supermarket stays after a page reload
- End-to-end check of the whole flow (19 steps) passes; axe: 0 problems
- When the only offer is a big pack (Netto: 12 l milk for €8.88), the list says "big pack, 12 l"
- Live test on spart-plum.vercel.app + the real server: 20 steps pass

## No dummy data
- Removed the 27-product list I made as dummy data in week 1, its prices and sizes, and the 11 offers matched to it — from the app, the server and MongoDB (the server drops the old collections on start)
- New flow: open the app → "Which supermarkets can you go to?" (step 1, at least two suggested) → write the list → the list ordered by category, each item with its cheapest offer at your supermarkets, if there is one
- English and German: German words are searched in the Prospekte as typed; common English words are translated by a word list (`words.ts`: words only, no products or prices). Any word can be typed
- AI Prospekt import now writes every offer to `data/prospekt/<chain>.txt` (no matching to a product list)
- 24 tests; axe: 0 problems on all 7 screens

## Offers only
- The plan shows only real Prospekt offers from the user's supermarkets: no normal prices, no estimates
- Items without an offer stay on the list without a price ("Not on offer this week")
- "Which supermarkets can you go to?" suggests picking at least two, to compare offers

## Your supermarkets
- New step "Where do you shop?": the user picks one or more of the six supermarkets (saved on the phone, changeable on Home)
- The plan only uses those supermarkets: for each item the cheapest real price, grouped by store ("At Kaufland · 7 items")
  - an offer from this week's Prospekt of one of their stores, or REWE's normal shop price when it is cheaper (e.g. milk: REWE €0.85 vs. offers)
  - pack sizes compared by the price per kg/l printed in the Prospekt; big packs (a 12 l crate for 1 l of milk) go last
  - a saving only when the Prospekt prints the old price, or for REWE offers vs. REWE's own price; no estimated prices for other stores
- No more long list of every offer; the checklist is grouped by store
- API: POST /api/plan takes `chains`; tests for the new logic (27 passing); axe: 0 problems on the new screens

## Accessibility & search accuracy
- Accessibility (WCAG 2.1 AA): axe finds 0 problems on all 10 screens (before: color contrast on 9 screens, missing main/h1, unnamed progress bar)
  - Color tokens fixed at the source: `faint` #8a8d99 → #6c6f7c, `save` #0fa968 → #0a8752 (4.5:1)
  - Visible focus ring for keyboard users (`:focus-visible`)
  - "Wrong price?" sheet: focus moves into it, Escape closes it, focus returns to the link
  - Every screen has a `main` landmark and one `h1`; the shopping progress bar has a name
- Lighthouse (local production build, mobile): Accessibility 94 → 100, SEO 91 → 100 (robots.txt), Performance 98–99
- "In this week's Prospekte" for our 27 products uses a precise German word list per product:
  no more pork mince for "minced beef", crisps for "potatoes" or chicken legs for "chicken breast" (tests added)

## Real data only · before Demo Day
- No made-up data any more: the 41 demo offers are deleted (server and app); the app's built-in fallback uses this week's real offers
- Normal prices: the real REWE online-shop price (Siegburg) is the estimate for all six stores, so the best offers decide the winner. Frozen spinach and toilet paper have no real price, so they show as "not in our price list"
- Matched offers re-checked against these prices: 11 this week
- The "Checking this week's Prospekte" screen counts this week's real offers
- Removed "Tell me what to buy" (meal plan) — not part of this version
- Fix: items without a price no longer break the basket total in the app's own calculation

## Weekly data update · KW 47 (16.–21.11.2026)
- New Prospekt offers for Siegburg, read from kaufDA (ALDI SÜD from aldi-sued.de): 700 offers — REWE 144, Kaufland 181, Penny 131, Netto 124, Lidl 65, ALDI 55
- 17 offers matched to our 27 products (data/imported/)
- Last week's offers are deleted: on start the server replaces both the Prospekt offers and the matched offers in MongoDB
- Search test now uses the current Prospekt week, so it keeps working after each update

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
- Real ALDI SÜD offers (9.–14.11.2026) from aldi-sued.de: apples, onions, orange juice; ALDI butter normal price 1.15 (permanent price)
- New stores: Kaufland, Penny and Netto (6 supermarkets now), with this week's Siegburg offers from their Prospekte; price sources in `server/data/PRICES.md`
- All Prospekt offers: about 500 food and household offers from all six Prospekte (`server/data/prospekt/`). Anything on a list, also outside the 27-product price list ("Toffifee", "Lachs", "chocolate"), is searched in them; the plan shows where each item is on offer
- Backend live on Render with MongoDB Atlas; it copies the Prospekt offers into MongoDB on every start

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
