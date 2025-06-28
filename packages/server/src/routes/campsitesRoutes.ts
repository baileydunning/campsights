import { Router, Request, Response } from 'express';
import { getCampsites, addCampsite, updateCampsite } from '../controllers/campsitesController';

const campsitesRouter = Router();

campsitesRouter.get('/', (req: Request, res: Response) => {
  getCampsites(req, res);
});

campsitesRouter.post('/', (req: Request, res: Response) => {
  addCampsite(req, res);
});

campsitesRouter.put('/:id', (req: Request, res: Response) => {
  updateCampsite(req, res);
});

export default campsitesRouter;