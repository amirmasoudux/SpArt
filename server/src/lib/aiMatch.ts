// Item names our simple word list does not know ("Haferdrink", "loo roll", "banans").
// The AI links each one to a product in our catalog, or says null.
import { aiConfigured, askForJson } from '../ai.js';
import { MatchAnswer, type Product } from '../schemas.js';

const MATCH_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['matches'],
  properties: {
    matches: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'productId'],
        properties: { name: { type: 'string' }, productId: { type: ['string', 'null'] } },
      },
    },
  },
};

export async function matchWithAi(names: string[], products: Product[]): Promise<{ name: string; productId: string | null }[]> {
  if (!aiConfigured()) return names.map((name) => ({ name, productId: null }));
  const answer = await askForJson({
    system:
      'You match shopping list words (English or German, maybe misspelled) to a product catalog. ' +
      'Return the product id only when you are sure it is the same kind of product. Otherwise return null.',
    text: `Catalog (id: name, size):\n${products.map((p) => `${p.id}: ${p.name}, ${p.unit}`).join('\n')}\n\nWords:\n${names.join('\n')}`,
    schema: MatchAnswer,
    jsonSchema: MATCH_JSON_SCHEMA,
  });
  // Never trust an id the catalog does not have.
  const known = new Set(products.map((p) => p.id));
  return names.map((name) => {
    const hit = answer.matches.find((m) => m.name.toLowerCase() === name.toLowerCase());
    return { name, productId: hit?.productId && known.has(hit.productId) ? hit.productId : null };
  });
}
