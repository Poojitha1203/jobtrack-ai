import type { Request, Response } from 'express';
import { getAuth } from '../middleware/requireAuth.js';
import * as service from '../services/companies.service.js';
import { parseId, parseQuery } from '../utils/parse.js';
import {
  listCompaniesQuerySchema,
  type CreateCompanyInput,
  type UpdateCompanyInput,
} from '../validators/company.schema.js';
import type { CompanyResponse } from '../types/api.js';

export const listCompanies = async (req: Request, res: Response<{ items: CompanyResponse[] }>) => {
  const { supabase } = getAuth(req);
  const query = parseQuery(listCompaniesQuerySchema, req.query);
  res.json({ items: await service.listCompanies(supabase, query) });
};

export const getCompany = async (req: Request, res: Response<CompanyResponse>) => {
  const { supabase } = getAuth(req);
  res.json(await service.getCompany(supabase, parseId(req.params.id, 'Company')));
};

export const createCompany = async (req: Request, res: Response<CompanyResponse>) => {
  const { supabase, userId } = getAuth(req);
  res.status(201).json(await service.createCompany(supabase, userId, req.body as CreateCompanyInput));
};

export const updateCompany = async (req: Request, res: Response<CompanyResponse>) => {
  const { supabase } = getAuth(req);
  const id = parseId(req.params.id, 'Company');
  res.json(await service.updateCompany(supabase, id, req.body as UpdateCompanyInput));
};

export const deleteCompany = async (req: Request, res: Response) => {
  const { supabase } = getAuth(req);
  await service.deleteCompany(supabase, parseId(req.params.id, 'Company'));
  res.status(204).end();
};
