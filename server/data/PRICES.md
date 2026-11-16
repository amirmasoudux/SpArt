# Where the prices come from

All data is real and for **Siegburg**. There is no made-up data, no product list and no estimated price.

## Offers (the only prices in the app)
- `prospekt/*.txt`: every food, drink and household offer of this week's Prospekte, read from kaufDA
  (ALDI SÜD from aldi-sued.de/angebote — kaufDA has no ALDI SÜD Prospekt for Siegburg).
  One line per offer: `title | price | old price ("statt", if printed) | size or price per kg/l`.
- Replaced every week; last week's offers are deleted from MongoDB when the server starts.
- Or with AI from Prospekt page images: `npm run import-flyer -- --chain rewe page1.png` (writes the same file).

## How the app uses them
1. The user picks the supermarkets they can go to (we suggest at least two).
2. For each item on the list: the cheapest offer at those supermarkets this week.
   Pack sizes are compared by the price per kg / litre when the Prospekt prints it.
3. No offer → the item stays on the list without a price.
4. "You save" only when the Prospekt prints the old price.

## Search words (`server/src/lib/words.ts`)
Not data, only words: English/German list words → German Prospekt words ("minced beef" → "Rinderhackfleisch",
not pork mince) and a category for ordering the list. Any other word is searched in the Prospekte as typed.

## Receipts
Amir's own receipts (Lidl Plus, REWE eBon, Kaufland) are in a separate SQLite database outside git.
They were used to check prices; they are not part of the app data.
