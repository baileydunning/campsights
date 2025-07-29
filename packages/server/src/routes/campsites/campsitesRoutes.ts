import { Router, Request, Response } from 'express';
import { getCampsites, getCampsiteById } from '../../controllers/campsites/campsitesController';

const campsitesRouter = Router();

campsitesRouter.get('/', (req: Request, res: Response) => {
  getCampsites(req, res);
});

campsitesRouter.get('/:id', (req: Request, res: Response) => {
  getCampsiteById(req, res);
});

export default campsitesRouter;