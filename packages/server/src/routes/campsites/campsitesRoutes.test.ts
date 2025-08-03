import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import campsitesRouter from './campsitesRoutes'

// Mock only the read-only controller methods
vi.mock('../../controllers/campsites/campsitesController', () => ({
  getCampsites: vi.fn((req, res) => res.status(200).json([{ id: '1', name: 'Test Campsite' }])),
  getCampsiteById: vi.fn((req, res) =>
    res.status(200).json({ id: req.params.id, name: 'Test Campsite By ID' })
  ),
}))

const app = express()
app.use(express.json())
app.use('/campsites', campsitesRouter)

describe('campsitesRouter', () => {
  it('GET /campsites should call getCampsites and return campsites', async () => {
    const res = await request(app).get('/campsites')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([{ id: '1', name: 'Test Campsite' }])
  })

  it('GET /campsites/:id should call getCampsiteById and return the campsite', async () => {
    const res = await request(app).get('/campsites/123')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ id: '123', name: 'Test Campsite By ID' })
  })
})
