import { Router, Request, Response } from 'express';
import { getAllCampsites, addCampsite } from '../services/campsitesService';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const campsites = await getAllCampsites();
    res.json(campsites);
  } catch (err) {
    res.status(500).json({ error: 'Unable to load campsites' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const newCampsite = await addCampsite(req.body);
    res.status(201).json(newCampsite);
  } catch (err) {
    res.status(500).json({ error: 'Unable to save campsite' });
  }
});

export default router;