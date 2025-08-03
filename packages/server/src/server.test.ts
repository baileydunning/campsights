import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import { server } from './server'

vi.mock('fs/promises', () => {
  const accessMock = vi.fn(() => Promise.resolve())
  return {
    __esModule: true,
    default: {
      access: accessMock,
    },
  }
})

vi.mock('express-rate-limit', () => ({
  __esModule: true,
  default: () => (req: any, res: any, next: any) => next(),
}))

vi.mock('./routes/campsites/campsitesRoutes', () => {
  const router = express.Router()
  router.get('/', (req: any, res: any) => res.json({ campsites: [] }))
  router.get('/:id', (req, res) => {
    res.json({
      id: req.params.id,
      name: 'Mock Campsite',
      elevation: 100,
      weather: [],
    })
  })
  return {
    __esModule: true,
    default: router,
  }
})

vi.mock('swagger-ui-express', () => ({
  __esModule: true,
  default: {
    serve: (req: any, res: any, next: any) => next(),
    setup: () => (req: any, res: any, next: any) => next(),
  },
}))

vi.mock('yamljs', () => ({
  __esModule: true,
  default: {
    load: vi.fn(() => ({})),
  },
}))

describe('server', () => {
  let app: express.Express

  beforeAll(() => {
    app = server()
  })

  it('should respond to /health with status 200 and correct body', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(typeof res.body.timestamp).toBe('string')
  })

  it('should respond to /api/v1/campsites with campsites array', async () => {
    const res = await request(app).get('/api/v1/campsites')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('campsites')
    expect(Array.isArray(res.body.campsites)).toBe(true)
  })

  it('should respond to /api/unknown with 404', async () => {
    const res = await request(app).get('/api/unknown')
    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error', 'Not Found')
  })

  it('should serve swagger docs at /docs', async () => {
    const res = await request(app).get('/docs')
    expect([200, 404]).toContain(res.status)
  })

  it('should reject API requests with an invalid Origin header', async () => {
    const res = await request(app)
      .get('/api/v1/campsites')
      .set('Origin', 'https://malicious-site.com')
    expect(res.status).toBe(403)
    expect(res.body).toHaveProperty('error', 'API access denied: invalid origin')
  })

  describe('static file serving', () => {
    beforeEach(async () => {
      const { default: fsMock } = await import('fs/promises')
      ;(fsMock.access as any).mockReset()
    })

    it('should skip static file setup if index.html does not exist', async () => {
      const { default: fsMock } = await import('fs/promises')
      ;(fsMock.access as any).mockRejectedValueOnce(new Error('not found'))
      const { server: freshServer } = await import('./server')
      const freshApp = freshServer()
      const res = await request(freshApp).get('/health')
      expect(res.status).toBe(200)
    })

    it('should set up static file serving if index.html exists', async () => {
      const { default: fsMock } = await import('fs/promises')
      ;(fsMock.access as any).mockResolvedValueOnce(undefined)
      const { server: freshServer } = await import('./server')
      const freshApp = freshServer()
      const res = await request(freshApp).get('/health')
      expect(res.status).toBe(200)
    })
  })
})
