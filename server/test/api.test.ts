import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { memoryRepo } from '../src/repo.js';

const app = createApp(memoryRepo());

describe('API', () => {
  it('GET /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('GET /api/catalog returns stores and products', async () => {
    const res = await request(app).get('/api/catalog');
    expect(res.body.stores).toHaveLength(6);
    expect(res.body.products.length).toBeGreaterThan(20);
  });

  it('POST /api/plan returns one pick per item for the user’s supermarkets', async () => {
    const res = await request(app)
      .post('/api/plan')
      .send({ items: [{ id: '1', name: 'Milk', qty: 2, productId: 'milk-1l' }], chains: ['rewe'] });
    expect(res.status).toBe(200);
    expect(res.body.picks).toHaveLength(1);
    expect(res.body.picks[0].chain).toBe('rewe'); // an offer or REWE's normal price, never another store
  });

  it('POST /api/plan keeps items outside the catalog on the list', async () => {
    const res = await request(app)
      .post('/api/plan')
      .send({ items: [{ id: '1', name: 'Toffifee', qty: 1, productId: null }], chains: ['lidl', 'aldi'] });
    expect(res.status).toBe(200);
    expect(res.body.picks).toHaveLength(1);
  });

  it('POST /api/plan rejects an unknown supermarket', async () => {
    const res = await request(app)
      .post('/api/plan')
      .send({ items: [{ id: '1', name: 'Milk', qty: 1, productId: 'milk-1l' }], chains: ['edeka'] });
    expect(res.status).toBe(400);
  });

  it('POST /api/plan rejects bad input with 400', async () => {
    const res = await request(app).post('/api/plan').send({ items: [{ id: '1', qty: 0 }] });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid request');
  });
});

describe('API week 3', () => {
  it('POST /api/reports saves a report', async () => {
    const res = await request(app).post('/api/reports').send({ productId: 'milk-1l', storeId: 'rewe', kind: 'wrong_price', correctPrice: 1.19 });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
  });

  it('POST /api/reports rejects an unknown kind', async () => {
    const res = await request(app).post('/api/reports').send({ productId: 'milk-1l', storeId: 'rewe', kind: 'boring' });
    expect(res.status).toBe(400);
  });

  it('POST /api/items/match answers null for all without AI', async () => {
    const res = await request(app).post('/api/items/match').send({ names: ['Haferdrink'] });
    expect(res.body).toEqual({ matches: [{ name: 'Haferdrink', productId: null }], aiUsed: false });
  });
});
