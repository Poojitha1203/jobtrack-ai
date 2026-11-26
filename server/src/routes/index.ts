import { Router } from 'express';
import healthRoutes from './health.routes.js';
import profileRoutes from './profile.routes.js';
import applicationRoutes from './applications.routes.js';
import companyRoutes from './companies.routes.js';
import interviewRoutes from './interviews.routes.js';
import reminderRoutes from './reminders.routes.js';
import resumeRoutes from './resumes.routes.js';
import jobMatchRoutes from './jobMatch.routes.js';
import skillRoutes from './skills.routes.js';
import interviewPrepRoutes from './interviewPrep.routes.js';
import analyticsRoutes from './analytics.routes.js';
import billingRoutes from './billing.routes.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.use('/health', healthRoutes);

router.use('/profile', requireAuth, profileRoutes);
router.use('/applications', requireAuth, applicationRoutes);
router.use('/companies', requireAuth, companyRoutes);
router.use('/interviews', requireAuth, interviewRoutes);
router.use('/reminders', requireAuth, reminderRoutes);
router.use('/resumes', requireAuth, resumeRoutes);
router.use('/job-match', requireAuth, jobMatchRoutes);
router.use('/skills', requireAuth, skillRoutes);
router.use('/interview-prep', requireAuth, interviewPrepRoutes);
router.use('/analytics', requireAuth, analyticsRoutes);
router.use('/billing', requireAuth, billingRoutes);

export default router;
