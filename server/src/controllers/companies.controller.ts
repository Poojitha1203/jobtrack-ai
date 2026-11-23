import type { Request, Response } from 'express';
import { getAuth } from '../middleware/requireAuth.js';
import { listCompanies as listCompaniesFromDb } from '../services/companies.service.js';
import type { CompanySummary } from '../types/api.js';

export const listCompanies = async (req: Request, res: Response<{ items: CompanySummary[] }>) => {
  const { supabase } = getAuth(req);
  res.json({ items: await listCompaniesFromDb(supabase) });
};
