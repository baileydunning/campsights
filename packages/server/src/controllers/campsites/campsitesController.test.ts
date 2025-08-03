import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest'
import { Request, Response } from 'express'

import { getCampsites, getCampsiteById } from './campsitesController'
import * as campsitesService from '../../services/campsites/campsitesService'

describe('campsitesController', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let statusMock: Mock
  let jsonMock: Mock
  let sendMock: Mock

  beforeEach(() => {
    statusMock = vi.fn().mockReturnThis()
    jsonMock = vi.fn().mockReturnThis()
    sendMock = vi.fn().mockReturnThis()
    req = {}
    res = {
      status: statusMock,
      json: jsonMock,
      send: sendMock,
    }
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('getCampsites', () => {
    it('should return campsites with status 200', async () => {
      const fakeCampsites = [
        {
          id: '1',
          name: 'Test Campsite',
          url: 'https://example.com',
          lat: 10,
          lng: 20,
          state: 'Test State',
          mapLink: 'https://example.com/map',
          source: 'BLM' as const,
        },
      ]
      vi.spyOn(campsitesService, 'getCampsites').mockResolvedValue(fakeCampsites)

      await getCampsites(req as Request, res as Response)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith(fakeCampsites)
    })

    it('should handle errors and return status 500', async () => {
      vi.spyOn(campsitesService, 'getCampsites').mockRejectedValue(new Error('fail'))

      await getCampsites(req as Request, res as Response)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unable to fetch campsites',
          message: 'fail',
        })
      )
    })
  })

  describe('getCampsiteById', () => {
    it('should return campsite with status 200', async () => {
      req.params = { id: '123' }
      const fakeCampsite = {
        id: '123',
        name: 'Test Campsite By ID',
        url: 'https://example.com',
        lat: 10,
        lng: 20,
        state: 'Test State',
        mapLink: 'https://example.com/map',
        source: 'BLM' as const,
        elevation: 100,
        weather: [],
      }
      vi.spyOn(campsitesService, 'getCampsiteById').mockResolvedValue(fakeCampsite)

      await getCampsiteById(req as Request, res as Response)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith(fakeCampsite)
    })

    it('should handle errors and return status 500', async () => {
      req.params = { id: '123' }
      vi.spyOn(campsitesService, 'getCampsiteById').mockRejectedValue(new Error('fail'))

      await getCampsiteById(req as Request, res as Response)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unable to fetch campsite',
          message: 'fail',
        })
      )
    })
  })
})
