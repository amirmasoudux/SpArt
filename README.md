# SpArt · The art of Sparen

Type your shopping list. SpArt checks this week's Prospekte and tells you the cheapest store for your list, and how much you save.

WBS Coding School final project (3 weeks).

## Live

- App (frontend, Vercel): https://spart-plum.vercel.app
- API (backend, Render): https://spart-api.onrender.com/api/health — free plan, wakes up in about 50 seconds after a quiet time
- Database: MongoDB Atlas (free M0, Frankfurt)

## Versions

| Version | Branch | What it has |
|---|---|---|
| v0.1 (week 1) | `week-1` | Write a list, check and edit it, save it in the browser |
| v0.2 (week 2, MVP) | `week-2` | + Express API, MongoDB, Prospekt import with AI, cheapest store, shopping checklist, savings |
| v0.3 (week 3) | `week-3` | + final design, AI list understanding, report wrong prices, meal plan, deploy setup |

See `CHANGELOG.md` for details.

## Run it

You need Node.js 20 or newer.

**Backend** (in one Terminal):
```
cd server
npm install
cp .env.example .env     # then fill in MONGO_URI (optional) and AI_API_KEY (optional)
npm run dev              # http://localhost:4000
```
Without `MONGO_URI` the server uses the demo data in memory, so it works right away.
Without `AI_API_KEY` the meal plan uses our own recipes and unknown words stay unknown.

**Frontend** (in a second Terminal):
```
npm install
npm run dev              # http://localhost:5173
```
If the backend is not running, the app uses the demo data in the browser.

## Useful commands (server)

| Command | What it does |
|---|---|
| `npm test` | Runs the tests (plan logic, Prospekt import, API) |
| `npm run seed` | Puts the demo data into MongoDB (needs `MONGO_URI`) |
| `npm run import-flyer -- --chain rewe --from 2026-11-16 --to 2026-11-21 page1.png` | Reads Prospekt pages with AI and saves the offers |
| `npm run import-flyer -- --chain rewe --from 2026-11-16 --to 2026-11-21 --sample scripts/sample-flyer-answer.json --dry-run` | Practice run without AI and without saving |

## Folders

```
src/            frontend (React + TypeScript + Tailwind)
  pages/        one file per screen
  components/   pieces used on many screens
  lib/          logic: parse the list, storage, API calls, plan
  data/         demo data (used when the backend is not running)
server/         backend (Express + MongoDB + Zod)
  src/app.ts    API routes
  src/repo.ts   data access (MongoDB or demo data)
  src/lib/      plan logic, Prospekt import, product matching
  scripts/      seed and Prospekt import
  test/         tests
```

## Deploy

- **Backend → Render:** New → Blueprint → this repo (uses `render.yaml`). Set `MONGO_URI`, `CLIENT_URL` and `AI_API_KEY` in the dashboard.
- **Frontend → Vercel:** import the repo, framework "Vite", and set `VITE_API_URL` to the Render address.
- **Database → MongoDB Atlas:** create a free cluster, copy the connection string into `MONGO_URI`, then run `npm run seed` once.
