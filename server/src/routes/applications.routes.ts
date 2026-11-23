import { Router } from 'express';
import {
  createApplication,
  deleteApplication,
  getApplication,
  listAllApplications,
  listApplications,
  moveApplication,
  updateApplication,
} from '../controllers/applications.controller.js';
import { validateBody } from '../middleware/validate.js';
import { createApplicationSchema, moveApplicationSchema, updateApplicationSchema } from '../validators/application.schema.js';

const router = Router();

router.get('/', listApplications);
router.get('/summary', listAllApplications); // must come before '/:id'
router.post('/', validateBody(createApplicationSchema), createApplication);
router.get('/:id', getApplication);
router.patch('/:id', validateBody(updateApplicationSchema), updateApplication);
router.patch('/:id/move', validateBody(moveApplicationSchema), moveApplication);
router.delete('/:id', deleteApplication);

export default router;
