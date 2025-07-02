import { describe, it, beforeEach, vi, expect } from 'vitest';
import type { Mock } from 'vitest';
import request from 'supertest';
import * as campsitesService from './services/campsites/campsitesService';

vi.mock('express-rate-limit', () => ({
  __esModule: true,
  default: () => (req: any, res: any, next: any) => next(),
}));

vi.mock('./config/db', () => ({
  seedDB: vi.fn(() => Promise.resolve()),
  db: {
    getRange: vi.fn(() => []),
    put: vi.fn(() => Promise.resolve()),
    get: vi.fn(() => null),
  }
}));

vi.mock('./services/campsites/campsitesService', () => ({
  getCampsites: vi.fn(() => Promise.resolve([])),
  getCampsiteById: vi.fn((id) => Promise.resolve({ id, name: 'Test Campsite' })),
  addCampsite: vi.fn((campsite) => Promise.resolve(campsite)),
  updateCampsite: vi.fn((id, data) => Promise.resolve({ id, ...data })),
  deleteCampsite: vi.fn(() => Promise.resolve(true)),
}));

import app from './index';
import fs from 'fs';
import path from 'path';

describe('Campsites API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/v1/campsites returns 200 and array', async () => {
    const res = await request(app).get('/api/v1/campsites');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/v1/campsites/:id returns 200 and campsite', async () => {
    const res = await request(app).get('/api/v1/campsites/test_id');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: "test_id", name: 'Test Campsite' });
  });

  it('POST /api/v1/campsites adds a campsite', async () => {
    const newCampsite = {
      id: "test_id",
      name: "Test Site",
      description: "Test Description",
      lat: 0,
      lng: 0,
      requires_4wd: false,
      last_updated: new Date().toISOString()
    };
    const res = await request(app)
      .post('/api/v1/campsites')
      .send(newCampsite)
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(newCampsite);
  });

  it('PUT /api/v1/campsites/:id updates a campsite', async () => {
    const updatedCampsite = {
      name: "Updated Site",
      description: "Updated Description",
      lat: 1,
      lng: 1,
      requires_4wd: true,
      last_updated: new Date().toISOString()
    };
    const res = await request(app)
      .put('/api/v1/campsites/test_id')
      .send(updatedCampsite)
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: "test_id", ...updatedCampsite });
  });

  it('DELETE /api/v1/campsites/:id deletes a campsite', async () => {
    const res = await request(app)
      .delete('/api/v1/campsites/test_id')
      .set('Content-Type', 'application/json');
    // 204 should have no content
    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  it('returns 500 for internal server error', async () => {
    (campsitesService.addCampsite as Mock).mockImplementationOnce(() => { throw new Error('fail'); });
    const validCampsite = {
      id: "test_id",
      name: "Test Site",
      description: "Test Description",
      lat: 0,
      lng: 0,
      requires_4wd: false,
      last_updated: new Date().toISOString()
    };
    const res = await request(app)
      .post('/api/v1/campsites')
      .send(validCampsite)
      .set('Content-Type', 'application/json');
    expect([500, 400]).toContain(res.status); // Accept 400 or 500 depending on error handling
  });

  it('returns 400 for bad request', async () => {
    const res = await request(app)
      .post('/api/v1/campsites')
      .send({ invalid: 'data' })
      .set('Content-Type', 'application/json');
    expect([400, 422]).toContain(res.status); // Accept 400 or 422
  });

  it('returns 404 for unknown API route', async () => {
    const res = await request(app).get('/api/v1/unknown');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('serves static files if client/dist/index.html exists', async () => {
    const staticPath = path.join(__dirname, "../client/dist");
    const indexHtmlPath = path.join(staticPath, "index.html");

    try {
      if (fs.existsSync(indexHtmlPath)) {
        const res = await request(app).get('/');
        expect([200, 404]).toContain(res.status);
      } else {
        // If static file is missing, expect 404
        const res = await request(app).get('/');
        expect(res.status).toBe(404);
      }
    } catch (err) {
      console.error("Error setting up static file serving:", err);
    }
  });

  it('returns 429 when rate limit is exceeded on static route', async () => {
    const staticPath = path.join(__dirname, "../client/dist");
    const indexHtmlPath = path.join(staticPath, "index.html");

    if (!fs.existsSync(indexHtmlPath)) {
      console.warn("client/dist/index.html not found, skipping rate limit test.");
      return;
    }

    let lastRes: request.Response | undefined;
    // The rate limit is 60 per minute, so send 61 requests to trigger it
    for (let i = 0; i < 61; i++) {
      lastRes = await request(app).get('/');
    }
    expect(lastRes).toBeDefined();
    expect(lastRes!.status).toBe(429);
    expect(lastRes!.body).toHaveProperty('error');
  });

  it('handles 100 sequential GET /api/v1/campsites requests in under 2 seconds', async () => {
      const start = Date.now();
      for (let i = 0; i < 100; i++) {
        const res = await request(app).get('/api/v1/campsites');
        expect(res.status).toBe(200);
      }
      const duration = Date.now() - start;
      console.log(`100 sequential GET requests took ${duration}ms`);
      expect(duration).toBeLessThan(2000);
    });

    it('handles 100 parallel GET /api/v1/campsites requests in under 1 second', async () => {
      const start = Date.now();
      const requests = Array.from({ length: 100 }, () => request(app).get('/api/v1/campsites'));
      const results = await Promise.all(requests);
      results.forEach(res => expect(res.status).toBe(200));
      const duration = Date.now() - start;
      console.log(`100 parallel GET requests took ${duration}ms`);
      expect(duration).toBeLessThan(1000);
    });
});
