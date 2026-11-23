import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/profile.controller.js';
import { validateBody } from '../middleware/validate.js';
import { updateProfileSchema } from '../validators/profile.schema.js';

// Mounted behind requireAuth in routes/index.ts, so every handler has req.auth.
const router = Router();

// GET /api/profile — the signed-in user's profile
router.get('/', getProfile);

// PATCH /api/profile — update name, headline, location or weekly goal
router.patch('/', validateBody(updateProfileSchema), updateProfile);

export default router;
