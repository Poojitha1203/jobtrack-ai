import { Router } from 'express';
import { createResume, deleteResume, listResumes, updateResume } from '../controllers/resumes.controller.js';
import { validateBody } from '../middleware/validate.js';
import { createResumeSchema, updateResumeSchema } from '../validators/resume.schema.js';

const router = Router();

router.get('/', listResumes);
router.post('/', validateBody(createResumeSchema), createResume);
router.patch('/:id', validateBody(updateResumeSchema), updateResume);
router.delete('/:id', deleteResume);

export default router;
