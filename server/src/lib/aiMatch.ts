// Item names our search words do not know ("loo roll", "banans").
// The AI links each one to a search word (lib/words.ts), or says null.
import { aiConfigured, askForJson } from '../ai.js';
import { MatchAnswer } from '../schemas.js';
import { WORDS } from './words.js';

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
        required: ['name', 'wordId'],
        properties: { name: { type: 'string' }, wordId: { type: ['string', 'null'] } },
      },
    },
  },
};

export async function matchWithAi(names: string[]): Promise<{ name: string; wordId: string | null }[]> {
  if (!aiConfigured()) return names.map((name) => ({ name, wordId: null }));
  const answer = await askForJson({
    system:
      'You match shopping list words (English or German, maybe misspelled) to a list of grocery words. ' +
      'Return the id only when you are sure it is the same kind of item. Otherwise return null.',
    text: `Grocery words (id: name):\n${WORDS.map((w) => `${w.id}: ${w.name}`).join('\n')}\n\nShopping list words:\n${names.join('\n')}`,
    schema: MatchAnswer,
    jsonSchema: MATCH_JSON_SCHEMA,
  });
  // Never trust an id we do not have.
  const known = new Set(WORDS.map((w) => w.id));
  return names.map((name) => {
    const hit = answer.matches.find((m) => m.name.toLowerCase() === name.toLowerCase());
    return { name, wordId: hit?.wordId && known.has(hit.wordId) ? hit.wordId : null };
  });
}
