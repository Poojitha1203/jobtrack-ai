import { Router } from 'express';
import healthRoutes from './health.routes.js';
import profileRoutes from './profile.routes.js';
import { requireAuth } from '../middleware/requireAuth.js';

// Root API router. Each feature adds its own router here.
const router = Router();

// Public
router.use('/health', healthRoutes);

// Signed-in users only
router.use('/profile', requireAuth, profileRoutes);

export default router;
