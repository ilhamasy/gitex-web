import { Router } from 'express';
import { validateUrl, getRepositoryMetadata } from '../controllers/repository.controller.js';
import { getTrendingRepositories } from '../controllers/trending.controller.js';

const router = Router();

router.post('/api/repository/validate', validateUrl);
router.post('/api/repository/metadata', getRepositoryMetadata);
router.get('/api/repository/trending', getTrendingRepositories);

export default router;
