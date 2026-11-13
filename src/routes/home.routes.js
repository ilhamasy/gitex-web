import { Router } from 'express';
import { getHome, getApp } from '../controllers/home.controller.js';

const router = Router();

router.get('/', getHome);
router.get('/app', getApp);
router.get('/explain', getApp);

export default router;

