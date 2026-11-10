import { afterEach, describe, expect, it, vi } from 'vitest';
import { matchWithAi } from '../src/lib/aiMatch.js';
import { loadDemoData } from '../src/repo.js';

const { products } = loadDemoData();

// Fake AI answer, so we test our code without calling a real AI.
function fakeAi(answer: unknown) {
  vi.stubEnv('AI_API_KEY', 'test-key');
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(answer) } }] }))));
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('matchWithAi', () => {
  it('keeps ids that exist and drops made-up ones', async () => {
    fakeAi({ matches: [{ name: 'banans', productId: 'bananas-1kg' }, { name: 'Haferdrink', productId: 'oat-milk-made-up' }] });
    const result = await matchWithAi(['banans', 'Haferdrink'], products);
    expect(result).toEqual([
      { name: 'banans', productId: 'bananas-1kg' },
      { name: 'Haferdrink', productId: null },
    ]);
  });

  it('fails loudly when the AI answer has the wrong shape', async () => {
    fakeAi({ wrong: true });
    await expect(matchWithAi(['banans'], products)).rejects.toThrow();
  });
});
