import { Router } from 'express';
import { getRecommendations, listQuestions, saveProgress } from '../controllers/interviewPrep.controller.js';
import { validateBody } from '../middleware/validate.js';
import { saveProgressSchema } from '../validators/interviewPrep.schema.js';

const router = Router();

router.get('/questions', listQuestions);
router.get('/recommendations', getRecommendations);
router.put('/progress/:questionId', validateBody(saveProgressSchema), saveProgress);

export default router;
