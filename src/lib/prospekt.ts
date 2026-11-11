// This week's full Prospekt offer lists, for the demo without a server.
// The server reads the same files (server/data/prospekt/*.txt) and stores them in MongoDB.
import aldi from '../../server/data/prospekt/aldi.txt?raw';
import kaufland from '../../server/data/prospekt/kaufland.txt?raw';
import lidl from '../../server/data/prospekt/lidl.txt?raw';
import netto from '../../server/data/prospekt/netto.txt?raw';
import penny from '../../server/data/prospekt/penny.txt?raw';
import rewe from '../../server/data/prospekt/rewe.txt?raw';
import type { Chain } from '../types';

export interface ProspektOffer {
  chain: Chain;
  title: string;
  price: number;
  regularPrice: number | null;
  unitInfo: string | null;
}

const FILES: Record<Chain, string> = { rewe, lidl, aldi, kaufland, penny, netto };

// Same dates as server/src/lib/prospekt.ts.
const WEEK: Record<Chain, { from: string; to: string }> = {
  rewe: { from: '2026-11-09', to: '2026-11-14' },
  lidl: { from: '2026-11-09', to: '2026-11-14' },
  aldi: { from: '2026-11-09', to: '2026-11-14' },
  kaufland: { from: '2026-11-09', to: '2026-11-14' },
  penny: { from: '2026-11-09', to: '2026-11-15' },
  netto: { from: '2026-11-09', to: '2026-11-14' },
};

function parse(chain: Chain, text: string): ProspektOffer[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((line) => {
      const [title, price, regular, unit] = line.split('|').map((p) => p.trim());
      const p = Number(price);
      const r = regular ? Number(regular) : null;
      return { chain, title, price: p, regularPrice: r && r > p ? r : null, unitInfo: unit || null };
    })
    .filter((o) => o.title && o.price > 0);
}

// Only the Prospekte that are valid today.
export function getProspektOffers(today = new Date()): ProspektOffer[] {
  return (Object.keys(FILES) as Chain[]).flatMap((chain) => {
    const from = new Date(`${WEEK[chain].from}T00:00:00`);
    const to = new Date(`${WEEK[chain].to}T23:59:59`);
    return from <= today && today <= to ? parse(chain, FILES[chain]) : [];
  });
}
