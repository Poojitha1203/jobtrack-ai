import { Router } from 'express';
import healthRoutes from './health.routes.js';

// Root API router. Each feature adds its own router here
// (e.g. router.use('/applications', applicationRoutes) in Phase 4).
const router = Router();

router.use('/health', healthRoutes);

export default router;
