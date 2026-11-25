import type { Request, Response } from 'express';
import { getAuth } from '../middleware/requireAuth.js';
import { analyzeJobMatch } from '../services/jobMatch.service.js';
import type { JobMatchInput } from '../validators/jobMatch.schema.js';
import type { JobMatchResponse } from '../types/api.js';

export const analyze = async (req: Request, res: Response<JobMatchResponse>) => {
  const { supabase } = getAuth(req);
  res.json(await analyzeJobMatch(supabase, req.body as JobMatchInput));
};
