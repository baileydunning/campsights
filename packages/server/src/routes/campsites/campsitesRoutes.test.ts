import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import campsitesRouter from './campsitesRoutes';

// Fix mock path to match router import
vi.mock('../../controllers/campsites/campsitesController', () => ({
    getCampsites: vi.fn((req, res) => res.status(200).json([{ id: 1, name: 'Test Campsite' }])),
    getCampsiteById: vi.fn((req, res) => res.status(200).json({ id: req.params.id, name: 'Test Campsite By ID' })),
    addCampsite: vi.fn((req, res) => res.status(201).json({ id: 2, ...req.body })),
    updateCampsite: vi.fn((req, res) => res.status(200).json({ id: req.params.id, ...req.body })),
    deleteCampsite: vi.fn((req, res) => res.status(204).json({})),
}));

const app = express();
app.use(express.json());
app.use('/campsites', campsitesRouter);

describe('campsitesRouter', () => {
    it('GET /campsites should call getCampsites and return campsites', async () => {
        const res = await request(app).get('/campsites');
        expect(res.status).toBe(200);
        expect(res.body).toEqual([{ id: 1, name: 'Test Campsite' }]);
    });

    it('GET /campsites/:id should call getCampsiteById and return the campsite', async () => {
        const res = await request(app).get('/campsites/123');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ id: '123', name: 'Test Campsite By ID' });
    });

    it('POST /campsites should call addCampsite and return new campsite', async () => {
        const newCampsite = {
          id: '2',
          name: 'New Campsite',
          description: 'A new test campsite',
          lat: 10,
          lng: 20,
          requires_4wd: false,
          last_updated: new Date().toISOString()
        };
        const res = await request(app).post('/campsites').send(newCampsite);
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ id: '2', name: 'New Campsite' });
    });

    it('PUT /campsites/:id should call updateCampsite and return updated campsite', async () => {
        const updatedCampsite = {
          name: 'Updated Campsite',
          description: 'Updated description',
          lat: 11,
          lng: 21,
          requires_4wd: true,
          last_updated: new Date().toISOString()
        };
        const res = await request(app).put('/campsites/123').send(updatedCampsite);
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ id: '123', name: 'Updated Campsite', description: 'Updated description' });
    });

    it('PUT /campsites/:id should return 404 if id is missing', async () => {
        const res = await request(app).put('/campsites/').send({ name: 'Invalid Update' });
        expect(res.status).toBe(404);
    });

    it('DELETE /campsites/:id should return 204', async () => {
        const res = await request(app).delete('/campsites/123');
        expect(res.status).toBe(204);
        expect(res.body).toEqual({});
    });
});