# Where the prices come from

All data is real and for **Siegburg** (the app does not ask for a location yet). There is no made-up data.

## Normal prices (`products.json`)
- Source: the **REWE online shop**, PETZ REWE Barbarastraße 4, Siegburg (pickup prices, checked 10.11.2026).
- The same REWE price is used as the **estimated normal price for all six stores** — the app shows it with "≈".
  So the store that wins is the one with the best offers for your list.
- Greek yogurt: REWE sells 4 × 150 g = 600 g for 1.39 €, scaled to 500 g (1.16 €).
- **No normal price:** frozen spinach and toilet paper (not in the REWE online shop). They are shown as
  "not in our price list"; their Prospekt offers still show up.

## Offers
- `prospekt/*.txt`: every food, drink and household offer of this week's Prospekte, read from kaufDA
  (ALDI SÜD from aldi-sued.de/angebote — kaufDA has no ALDI SÜD Prospekt for Siegburg). Replaced every week.
- `imported/*.json`: the offers that are clearly one of our 27 products and cheaper than the normal price.
  Replaced every week; last week's are deleted from MongoDB when the server starts.

## Receipts
Amir's own receipts (Lidl Plus, REWE eBon, Kaufland) are in a separate SQLite database outside git.
They were used to check prices; they are not part of the app data.
