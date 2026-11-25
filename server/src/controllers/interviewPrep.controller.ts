import type { Request, Response } from 'express';
import { getAuth } from '../middleware/requireAuth.js';
import * as service from '../services/interviewPrep.service.js';
import { parseId, parseQuery } from '../utils/parse.js';
import {
  listQuestionsQuerySchema,
  recommendationsQuerySchema,
  type SaveProgressInput,
} from '../validators/interviewPrep.schema.js';
import type { PrepRecommendationsResponse, QuestionListResponse } from '../types/api.js';

export const listQuestions = async (req: Request, res: Response<QuestionListResponse>) => {
  const { supabase } = getAuth(req);
  res.json(await service.listQuestions(supabase, parseQuery(listQuestionsQuerySchema, req.query)));
};

export const getRecommendations = async (req: Request, res: Response<PrepRecommendationsResponse>) => {
  const { supabase } = getAuth(req);
  res.json(await service.getRecommendations(supabase, parseQuery(recommendationsQuerySchema, req.query)));
};

export const saveProgress = async (req: Request, res: Response) => {
  const { supabase, userId } = getAuth(req);
  const questionId = parseId(req.params.questionId, 'Question');
  res.json(await service.saveProgress(supabase, userId, questionId, req.body as SaveProgressInput));
};
