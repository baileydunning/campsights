import express, { Request, Response } from 'express';
import fs from 'fs';
import cors from 'cors';
import path from 'path';
import { Campsite } from './types/campsite';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/v1/campsites', (_req: Request, res: Response) => {
  const filePath = path.join(__dirname, '../data/campsites.json');

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

app.post('/api/v1/campsites', (req: Request, res: Response) => {
  const filePath = path.join(__dirname, '../data/campsites.json');
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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});