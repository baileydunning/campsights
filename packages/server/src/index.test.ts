import { describe, it, beforeEach, vi, expect } from 'vitest';
import request from 'supertest';
import { server } from './server';

vi.mock('express-rate-limit', () => ({
  __esModule: true,
  default: () => (req: any, res: any, next: any) => next(),
}));

vi.mock('./services/campsites/campsitesService', () => ({
  getCampsites: vi.fn(() => Promise.resolve([])),
  getCampsiteById: vi.fn((id) => Promise.resolve({ id, name: 'Test Campsite', elevation: 100, weather: [] })),
}));

const app = server();

describe('Campsites API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/v1/campsites returns 200 and array', async () => {
    const res = await request(app).get('/api/v1/campsites');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/v1/campsites/:id returns 200 and campsite with enriched data', async () => {
    const res = await request(app).get('/api/v1/campsites/test_id');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ 
      id: "test_id", 
      name: 'Test Campsite',
      elevation: 100,
      weather: []
    });
  });

  it('GET /health returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('returns 404 for unknown API route', async () => {
    const res = await request(app).get('/api/v1/unknown');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('handles multiple GET /api/v1/campsites requests', async () => {
    const requests = Array.from({ length: 10 }, () => request(app).get('/api/v1/campsites'));
    const results = await Promise.all(requests);
    results.forEach(res => expect(res.status).toBe(200));
  });
});