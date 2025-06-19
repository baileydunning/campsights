import { Router, Request, Response } from 'express';
import { getCampsites, addCampsite } from '../controllers/campsitesController';

const campsitesRouter = Router();

campsitesRouter.get('/', (req: Request, res: Response) => {
  getCampsites(req, res);
});

campsitesRouter.post('/', (req: Request, res: Response) => {
  addCampsite(req, res);
});

export default campsitesRouter;