import type { Request, Response } from 'express';
import { getAuth } from '../middleware/requireAuth.js';
import * as service from '../services/resumes.service.js';
import { parseId } from '../utils/parse.js';
import type { CreateResumeInput, UpdateResumeInput } from '../validators/resume.schema.js';
import type { ResumeResponse } from '../types/api.js';

export const listResumes = async (req: Request, res: Response<{ items: ResumeResponse[] }>) => {
  const { supabase } = getAuth(req);
  res.json({ items: await service.listResumes(supabase) });
};

export const createResume = async (req: Request, res: Response<ResumeResponse>) => {
  const { supabase, userId } = getAuth(req);
  res.status(201).json(await service.createResume(supabase, userId, req.body as CreateResumeInput));
};

export const updateResume = async (req: Request, res: Response<ResumeResponse>) => {
  const { supabase } = getAuth(req);
  const id = parseId(req.params.id, 'Resume');
  res.json(await service.updateResume(supabase, id, req.body as UpdateResumeInput));
};

export const deleteResume = async (req: Request, res: Response) => {
  const { supabase } = getAuth(req);
  await service.deleteResume(supabase, parseId(req.params.id, 'Resume'));
  res.status(204).end();
};
