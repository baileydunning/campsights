import { Router } from 'express';
import { getElevationController } from '../../controllers/elevation/elevationController';

const elevationRouter = Router();

elevationRouter.get('/', (req, res, next) => {
  Promise.resolve(getElevationController(req, res)).catch(next);
});

export default elevationRouter;