// Reads the full offer lists of each Prospekt (data/prospekt/<chain>.txt).
// One line per offer: "title | price | regular price | unit". Lines starting with # are notes.
import { readdirSync, readFileSync } from 'node:fs';
import { ProspektOffer, type Chain } from '../schemas.js';
import { endOfDay } from './week.js';

// When each Prospekt is valid. Update this when new Prospekte are added.
export const PROSPEKT_WEEK: Record<Chain, { from: string; to: string }> = {
  rewe: { from: '2026-11-09', to: '2026-11-14' },
  lidl: { from: '2026-11-09', to: '2026-11-14' },
  aldi: { from: '2026-11-09', to: '2026-11-14' },
  kaufland: { from: '2026-11-09', to: '2026-11-14' },
  penny: { from: '2026-11-09', to: '2026-11-15' },
  netto: { from: '2026-11-09', to: '2026-11-14' },
};

export function parseProspekt(chain: Chain, text: string): ProspektOffer[] {
  const lines = text.split('\n').map((l) => l.trim());
  const source = (lines.find((l) => l.startsWith('#')) ?? `# ${chain} Prospekt`).slice(1).trim();
  const week = PROSPEKT_WEEK[chain];
  const num = (s: string | undefined) => (s && s.trim() ? Number(s.trim().replace(',', '.')) : null);
  return lines
    .filter((l) => l && !l.startsWith('#'))
    .map((line, i) => {
      const [title, price, regular, unit] = line.split('|').map((p) => p.trim());
      const regularPrice = num(regular);
      const offerPrice = num(price);
      return ProspektOffer.parse({
        id: `${chain}-${week.from}-${i + 1}`,
        chain,
        title,
        price: offerPrice,
        // A "statt" price lower than the offer is a typo in our notes: drop it.
        regularPrice: regularPrice && offerPrice && regularPrice > offerPrice ? regularPrice : null,
        unitInfo: unit || null,
        validFrom: new Date(`${week.from}T00:00:00`),
        validTo: endOfDay(new Date(`${week.to}T00:00:00`)),
        source,
      });
    });
}

export function loadProspektOffers(dir: string): ProspektOffer[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.txt'))
    .flatMap((f) => parseProspekt(f.replace('.txt', '') as Chain, readFileSync(dir + f, 'utf8')));
}
