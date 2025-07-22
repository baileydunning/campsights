import { Router, Request, Response } from 'express';
import { getCampsites, getCampsiteById, addCampsite, updateCampsite, deleteCampsite } from '../../controllers/campsites/campsitesController';
import { requireAuth } from '../../middleware/requireAuth';

const campsitesRouter = Router();

campsitesRouter.get('/', (req: Request, res: Response) => {
  getCampsites(req, res);
});

campsitesRouter.get('/:id', (req: Request, res: Response) => {
  getCampsiteById(req, res);
});

campsitesRouter.post('/', (req: Request, res: Response) => {
  addCampsite(req, res);
});

// Protected routes: require authentication
campsitesRouter.put('/:id', requireAuth, updateCampsite);

campsitesRouter.delete('/:id', requireAuth, deleteCampsite);

export default campsitesRouter;