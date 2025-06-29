import { Request, Response } from 'express';
import { getElevation } from '../../services/elevation/elevationService';

export const getElevationController = async (req: Request, res: Response) => {
  const { lat, lng } = req.query;
  const latitude = parseFloat(lat as string);
  const longitude = parseFloat(lng as string);

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ error: 'Query parameters lat and lng must be valid numbers.' });
  }

  try {
    const elevation = await getElevation(latitude, longitude);
    return res.json({ latitude, longitude, elevation });
  } catch (error: any) {
    console.error('Elevation lookup failed:', error);
    return res.status(502).json({ error: error.message || 'Failed to fetch elevation data from provider.' });
  }
};