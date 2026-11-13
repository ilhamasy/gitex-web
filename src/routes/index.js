import { Router } from 'express';
import homeRoutes from './home.routes.js';
import healthRoutes from './health.routes.js';
import repositoryRoutes from './repository.routes.js';
import analysisRoutes from './analysis.routes.js';

const router = Router();

router.use('/', homeRoutes);
router.use('/', healthRoutes);
router.use('/', repositoryRoutes);
router.use('/', analysisRoutes);

export default router;
