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
    expect(res.body.stores).toHaveLength(3);
    expect(res.body.products.length).toBeGreaterThan(20);
  });

  it('POST /api/plan ranks stores', async () => {
    const res = await request(app)
      .post('/api/plan')
      .send({ items: [{ id: '1', name: 'Milk', qty: 2, productId: 'milk-1l' }] });
    expect(res.status).toBe(200);
    expect(res.body.plans).toHaveLength(3);
  });

  it('POST /api/plan rejects bad input with 400', async () => {
    const res = await request(app).post('/api/plan').send({ items: [{ id: '1', qty: 0 }] });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid request');
  });
});
