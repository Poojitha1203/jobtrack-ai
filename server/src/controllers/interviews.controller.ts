import type { Request, Response } from 'express';
import { getAuth } from '../middleware/requireAuth.js';
import * as service from '../services/interviews.service.js';
import { parseId, parseQuery } from '../utils/parse.js';
import {
  listInterviewsQuerySchema,
  type CreateInterviewInput,
  type UpdateInterviewInput,
} from '../validators/interview.schema.js';
import type { InterviewResponse } from '../types/api.js';

export const listInterviews = async (req: Request, res: Response<{ items: InterviewResponse[] }>) => {
  const { supabase } = getAuth(req);
  const query = parseQuery(listInterviewsQuerySchema, req.query);
  res.json({ items: await service.listInterviews(supabase, query) });
};

export const getInterview = async (req: Request, res: Response<InterviewResponse>) => {
  const { supabase } = getAuth(req);
  res.json(await service.getInterview(supabase, parseId(req.params.id, 'Interview')));
};

export const createInterview = async (req: Request, res: Response<InterviewResponse>) => {
  const { supabase, userId } = getAuth(req);
  res.status(201).json(await service.createInterview(supabase, userId, req.body as CreateInterviewInput));
};

export const updateInterview = async (req: Request, res: Response<InterviewResponse>) => {
  const { supabase } = getAuth(req);
  const id = parseId(req.params.id, 'Interview');
  res.json(await service.updateInterview(supabase, id, req.body as UpdateInterviewInput));
};

export const deleteInterview = async (req: Request, res: Response) => {
  const { supabase } = getAuth(req);
  await service.deleteInterview(supabase, parseId(req.params.id, 'Interview'));
  res.status(204).end();
};
