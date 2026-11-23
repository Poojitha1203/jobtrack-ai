import { Router } from 'express';
import {
  createInterview,
  deleteInterview,
  getInterview,
  listInterviews,
  updateInterview,
} from '../controllers/interviews.controller.js';
import { validateBody } from '../middleware/validate.js';
import { createInterviewSchema, updateInterviewSchema } from '../validators/interview.schema.js';

const router = Router();

router.get('/', listInterviews);
router.post('/', validateBody(createInterviewSchema), createInterview);
router.get('/:id', getInterview);
router.patch('/:id', validateBody(updateInterviewSchema), updateInterview);
router.delete('/:id', deleteInterview);

export default router;
