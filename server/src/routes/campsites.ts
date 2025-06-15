import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { Campsite } from '../types/campsite';

const router = Router();

const getCampsitesFilePath = () =>
  path.join(__dirname, '../../data/campsites.json');

router.get('/', (_req: Request, res: Response) => {
  const filePath = getCampsitesFilePath();

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading campsites.json:', err);
      return res.status(500).json({ error: 'Unable to load campsites' });
    }

    try {
      const campsites: Campsite[] = JSON.parse(data);
      res.json(campsites);
    } catch (parseError) {
      console.error('Error parsing campsite data:', parseError);
      res.status(500).json({ error: 'Invalid campsite data format' });
    }
  });
});

router.post('/', (req: Request, res: Response) => {
  const filePath = getCampsitesFilePath();
  const newCampsite: Campsite = req.body;

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading campsites.json:', err);
      return res.status(500).json({ error: 'Unable to load campsites' });
    }

    try {
      const campsites: Campsite[] = JSON.parse(data);
      campsites.push(newCampsite);

      fs.writeFile(filePath, JSON.stringify(campsites, null, 2), (writeErr) => {
        if (writeErr) {
          console.error('Error writing to campsites.json:', writeErr);
          return res.status(500).json({ error: 'Unable to save campsite' });
        }
        res.status(201).json(newCampsite);
      });
    } catch (parseError) {
      console.error('Error parsing campsite data:', parseError);
      res.status(500).json({ error: 'Invalid campsite data format' });
    }
  });
});

export default router;