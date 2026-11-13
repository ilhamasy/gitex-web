import { Router } from 'express';
import homeRoutes from './home.routes.js';
import healthRoutes from './health.routes.js';
import repositoryRoutes from './repository.routes.js';

const router = Router();

router.use('/', homeRoutes);
router.use('/', healthRoutes);
router.use('/', repositoryRoutes);

export default router;
