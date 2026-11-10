// "Tell me what to buy": 4 answers → a meal plan → ingredients for the list.
// With an AI key the AI plans the meals; without one (or if the AI fails) we use our own recipes.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { aiConfigured, askForJson } from '../ai.js';
import { MealPlan, type MealPlanRequest, type Product } from '../schemas.js';

interface Recipe {
  name: string;
  time: 'quick' | 'normal' | 'slow';
  tags: string[]; // "vegetarian", "dairy", "fish", "pork"
  ingredients: string[];
}

const recipes = JSON.parse(readFileSync(fileURLToPath(new URL('../../data/meals.json', import.meta.url)), 'utf8')) as Recipe[];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Plan without AI: pick recipes that fit the answers, one after the other.
export function planFromRecipes(req: MealPlanRequest): MealPlan {
  const fits = recipes.filter((r) => {
    if (req.avoid.includes('meat') && !r.tags.includes('vegetarian')) return false;
    if (req.avoid.includes('dairy') && r.tags.includes('dairy')) return false;
    if (req.avoid.includes('fish') && r.tags.includes('fish')) return false;
    if (req.avoid.includes('pork') && r.tags.includes('pork')) return false;
    if (req.cook === 'quick' && r.time === 'slow') return false;
    return true;
  });
  const pool = fits.length ? fits : recipes.filter((r) => r.tags.includes('vegetarian'));
  const count = Math.min(req.days * req.mealsPerDay, 14);
  const meals = Array.from({ length: count }, (_, i) => {
    const recipe = pool[i % pool.length];
    return { day: DAYS[Math.floor(i / req.mealsPerDay)], name: recipe.name, ingredients: recipe.ingredients };
  });
  return { meals };
}

const MEAL_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['meals'],
  properties: {
    meals: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['day', 'name', 'ingredients'],
        properties: { day: { type: 'string' }, name: { type: 'string' }, ingredients: { type: 'array', items: { type: 'string' } } },
      },
    },
  },
};

export async function makeMealPlan(req: MealPlanRequest, products: Product[]): Promise<{ plan: MealPlan; source: 'ai' | 'recipes' }> {
  if (!aiConfigured()) return { plan: planFromRecipes(req), source: 'recipes' };
  try {
    const plan = await askForJson({
      system:
        'You plan simple, cheap weekly meals for a shopper in Germany. Prefer ingredients from the product list given. ' +
        'Write ingredient names in plain English, one product per entry, no amounts.',
      text:
        `Plan ${req.days} days with ${req.mealsPerDay} meal(s) per day. Cooking: ${req.cook}. ` +
        `Avoid: ${req.avoid.join(', ') || 'nothing'}. Days: ${DAYS.slice(0, req.days).join(', ')}.\n` +
        `Products we know: ${products.map((p) => p.name).join(', ')}.`,
      schema: MealPlan,
      jsonSchema: MEAL_JSON_SCHEMA,
    });
    return { plan, source: 'ai' };
  } catch (err) {
    console.error('AI meal plan failed, using recipes:', err);
    return { plan: planFromRecipes(req), source: 'recipes' };
  }
}
