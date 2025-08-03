import { Request, Response } from 'express'

import * as campsitesService from '../../services/campsites/campsitesService'

export const getCampsites = async (req: Request, res: Response) => {
  try {
    const campsites = await campsitesService.getCampsites()
    res.status(200).json(campsites)
  } catch (error) {
    console.error('Error in getCampsites controller:', error)
    res.status(500).json({
      error: 'Unable to fetch campsites',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

export const getCampsiteById = async (req: Request, res: Response) => {
  console.log('getCampsiteById called with params:', req.params)
  try {
    const { id } = req.params
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'id is required and must be a string' })
    }
    const campsite = await campsitesService.getCampsiteById(id)
    if (!campsite) {
      return res.status(404).json({ error: 'Campsite not found' })
    }
    res.status(200).json(campsite)
  } catch (error) {
    console.error('Error in getCampsiteById controller:', error)
    res.status(500).json({
      error: 'Unable to fetch campsite',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
