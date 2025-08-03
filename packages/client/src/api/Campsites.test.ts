import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getCampsites } from './Campsites'
import type { Campsite } from '../types/Campsite'

const mockCampsites: Campsite[] = [
  {
    id: '1',
    name: 'Sunny Camp',
    url: 'https://example.com/1',
    lat: 40,
    lng: -105,
    state: 'CO',
    mapLink: 'https://maps.example.com/1',
    source: 'BLM',
    description: 'Nice place',
  },
  {
    id: '2',
    name: 'Lakeview',
    url: 'https://example.com/2',
    lat: 41,
    lng: -106,
    state: 'CO',
    mapLink: 'https://maps.example.com/2',
    source: 'BLM',
    description: 'By the water',
  },
]

const mockCampsite: Campsite = {
  id: '3',
  name: 'Mountain Base',
  url: 'https://example.com/3',
  lat: 39,
  lng: -104,
  state: 'CO',
  mapLink: 'https://maps.example.com/3',
  source: 'BLM',
  description: 'High up',
}

describe('Campsites API', () => {
  const globalAny: any = global

  beforeEach(() => {
    globalAny.fetch = vi.fn()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('getCampsites', () => {
    it('should fetch and return campsites', async () => {
      globalAny.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCampsites,
      })

      const campsites = await getCampsites()
      expect(globalAny.fetch).toHaveBeenCalledWith('/api/v1/campsites')
      expect(campsites).toEqual(mockCampsites)
    })

    it('should throw error if response is not ok', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      globalAny.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      await expect(getCampsites()).rejects.toThrow('HTTP error! status: 500')
      consoleSpy.mockRestore()
    })
  })
})
