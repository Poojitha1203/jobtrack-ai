import { Router } from 'express';
import { analyze } from '../controllers/jobMatch.controller.js';
import { validateBody } from '../middleware/validate.js';
import { jobMatchSchema } from '../validators/jobMatch.schema.js';

const router = Router();

// POST because the job description and resume text can be long (too big for a URL).
router.post('/analyze', validateBody(jobMatchSchema), analyze);

export default router;
