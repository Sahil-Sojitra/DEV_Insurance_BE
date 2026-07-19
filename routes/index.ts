import express from 'express';

import { getHealth } from '../controllers/healthController';
import policiesRoutes from './policiesRoutes';

const router = express.Router();

router.get('/health', getHealth);
router.use('/policies', policiesRoutes);

export default router;
