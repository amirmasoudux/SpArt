import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { toProspektLines } from '../src/lib/flyer.js';
import { parseProspekt } from '../src/lib/prospekt.js';

describe('Prospekt import with AI', () => {
  it('turns the sample AI answer into Prospekt lines, keeping every valid offer', () => {
    const raw = JSON.parse(readFileSync(new URL('../scripts/sample-flyer-answer.json', import.meta.url), 'utf8')).offers;
    const { lines, invalid } = toProspektLines(raw);
    expect(lines.length).toBe(raw.length - 1);
    expect(lines.some((l) => l.startsWith('Lachsfilet'))).toBe(true); // no product list: everything is kept
    expect(invalid).toBe(1); // "2,99" is text, not a number
  });

  it('writes lines the server can read back', () => {
    const { lines } = toProspektLines([{ product: 'Rinderhackfleisch', price: 4.49, regularPrice: 6.99, unit: '1 kg = 8.98' }]);
    const [offer] = parseProspekt('kaufland', lines.join('\n'));
    expect(offer).toMatchObject({ title: 'Rinderhackfleisch', price: 4.49, regularPrice: 6.99, unitInfo: '1 kg = 8.98' });
  });
});
