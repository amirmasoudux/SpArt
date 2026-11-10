import { describe, expect, it } from 'vitest';
import { planFromRecipes } from '../src/lib/meals.js';

describe('planFromRecipes', () => {
  it('respects "no meat" and "no dairy"', () => {
    const plan = planFromRecipes({ days: 7, mealsPerDay: 1, cook: 'normal', avoid: ['meat', 'dairy'] });
    const names = plan.meals.map((m) => m.name);
    expect(names).not.toContain('Chicken rice bowl');
    expect(names).not.toContain('Spinach pasta with gouda');
    expect(plan.meals).toHaveLength(7);
  });

  it('gives days in order', () => {
    const plan = planFromRecipes({ days: 2, mealsPerDay: 2, cook: 'quick', avoid: [] });
    expect(plan.meals.map((m) => m.day)).toEqual(['Mon', 'Mon', 'Tue', 'Tue']);
  });
});
