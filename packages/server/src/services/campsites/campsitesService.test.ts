import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { Campsite } from '../../models/campsiteModel'
import { WeatherPeriod } from '../../models/weatherModel'

let campsitesService: typeof import('./campsitesService')

vi.mock('../elevation/elevationService', () => ({
  getElevation: vi.fn().mockResolvedValue(1234),
}))

vi.mock('../weather/weatherService', () => ({
  getWeather: vi.fn().mockResolvedValue([{ name: 'sunny' }]),
}))

vi.mock('../../utils/metrics', () => ({
  performanceMetrics: { recordResponseTime: vi.fn() },
}))

vi.mock('../../utils/cacheUtils', () => ({
  cacheUtils: () => vi.fn(),
}))

const mockCampsite: Campsite = {
  id: 'abc123',
  name: 'Test Site',
  lat: 40,
  lng: -105,
  elevation: null,
} as Campsite

const mockWeather: WeatherPeriod[] = [{ name: 'sunny' } as WeatherPeriod]

describe('campsitesService', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(async () => {
    originalEnv = { ...process.env }
    vi.resetModules()
    campsitesService = await import('./campsitesService')
    campsitesService.__clearCampsiteCache()
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  describe('getCampsites', () => {
    it('fetches and filters valid campsites', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue([
          { ...mockCampsite, lat: 40, lng: -105 },
          { ...mockCampsite, lat: 'bad', lng: -105 },
        ]),
      } as any)

      const result = await campsitesService.getCampsites()
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('abc123')
    })

    it('throws on fetch error', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 } as any)
      await expect(campsitesService.getCampsites()).rejects.toThrow('BLM API error: 500')
    })
  })

  describe('getCampsiteById', () => {
    it('returns null for invalid id', async () => {
      const result = await campsitesService.getCampsiteById('bad id!')
      expect(result).toBeNull()
    })

    it('fetches, caches, and returns campsite with weather and elevation', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ ...mockCampsite }),
      } as any)

      const result = await campsitesService.getCampsiteById('abc123')
      expect(result).toMatchObject({
        id: 'abc123',
        name: 'Test Site',
        lat: 40,
        lng: -105,
        elevation: 1234,
        weather: mockWeather,
      })
      ;(global.fetch as any).mockClear()
      await campsitesService.getCampsiteById('abc123')
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('returns null if fetch fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false } as any)
      const result = await campsitesService.getCampsiteById('abc123')
      expect(result).toBeNull()
    })

    it('handles weather/elevation failures gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockCampsite),
      } as any)

      const weatherService = await import('../weather/weatherService')
      const elevationService = await import('../elevation/elevationService')
      vi.mocked(weatherService.getWeather).mockRejectedValueOnce(new Error('fail'))
      vi.mocked(elevationService.getElevation).mockRejectedValueOnce(new Error('fail'))

      const result = await campsitesService.getCampsiteById('abc123')
      expect(result?.weather).toEqual([])
      expect(result?.elevation).toBeNull()
    })
  })

  describe('campsiteCache', () => {
    it('clears cache with __clearCampsiteCache', () => {
      campsitesService.campsiteCache.set('foo', { campsite: mockCampsite, timestamp: Date.now() })
      campsitesService.__clearCampsiteCache()
      expect(campsitesService.campsiteCache.size).toBe(0)
    })
  })

  describe('NODE_ENV !== "test" interval', () => {
    it('does not set interval if NODE_ENV is "test"', async () => {
      process.env.NODE_ENV = 'test'
      const setIntervalSpy = vi.spyOn(global, 'setInterval')
      vi.resetModules()
      await import('./campsitesService')
      expect(setIntervalSpy).not.toHaveBeenCalled()
      setIntervalSpy.mockRestore()
    })

    it('sets interval if NODE_ENV is not "test"', async () => {
      process.env.NODE_ENV = 'production'
      const setIntervalSpy = vi.spyOn(global, 'setInterval')
      vi.resetModules()
      await import('./campsitesService')
      expect(setIntervalSpy).toHaveBeenCalled()
      setIntervalSpy.mockRestore()
    })
  })
})
