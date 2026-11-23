import { Router } from 'express';
import healthRoutes from './health.routes.js';
import profileRoutes from './profile.routes.js';
import applicationRoutes from './applications.routes.js';
import companyRoutes from './companies.routes.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.use('/health', healthRoutes);

router.use('/profile', requireAuth, profileRoutes);
router.use('/applications', requireAuth, applicationRoutes);
router.use('/companies', requireAuth, companyRoutes);

export default router;
