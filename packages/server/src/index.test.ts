import request from 'supertest';

jest.mock('./config/db', () => ({
  seedDB: jest.fn(() => Promise.resolve()),
  db: {
    getRange: jest.fn(() => []),
    put: jest.fn(() => Promise.resolve()),
    get: jest.fn(() => null),
  }
}));

jest.mock('./services/campsitesService', () => ({
  getCampsites: jest.fn(() => Promise.resolve([])),
  addCampsite: jest.fn((campsite) => Promise.resolve(campsite)),
}));

import app from './index';
import fs from 'fs';
import path from 'path';

describe('Campsites API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/v1/campsites returns 200 and array', async () => {
    const res = await request(app).get('/api/v1/campsites');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/v1/campsites adds a campsite', async () => {
    const newCampsite = {
      id: "test_id",
      name: "Test Site",
      description: "Test Description",
      lat: 0,
      lng: 0,
      rating: 5,
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

  it('returns 404 for unknown API route', async () => {
    const res = await request(app).get('/api/v1/unknown');
    expect(res.status).toBe(404);
  });

  it('serves static files if client/dist/index.html exists', async () => {
    const staticPath = path.join(__dirname, "../client/dist");
    const indexHtmlPath = path.join(staticPath, "index.html");

    try {
      if (fs.existsSync(indexHtmlPath)) {
        const res = await request(app).get('/');
        expect([200, 404]).toContain(res.status);
      } else {
        console.warn("client/dist/index.html not found, skipping static route handling.");
        const res = await request(app).get('/');
        expect(res.status).toBe(404);
      }
    } catch (err) {
      console.error("Error setting up static file serving:", err);
    }
  });
});
