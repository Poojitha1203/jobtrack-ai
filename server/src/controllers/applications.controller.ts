import type { Request, Response } from 'express';
import { getAuth } from '../middleware/requireAuth.js';
import * as service from '../services/applications.service.js';
import { parseId, parseQuery } from '../utils/parse.js';
import { listApplicationsQuerySchema } from '../validators/application.schema.js';
import type {
  CreateApplicationInput,
  UpdateApplicationInput,
} from '../validators/application.schema.js';
import type { ApplicationResponse, PaginatedResponse } from '../types/api.js';

export const listApplications = async (req: Request, res: Response<PaginatedResponse<ApplicationResponse>>) => {
  const { supabase } = getAuth(req);
  const query = parseQuery(listApplicationsQuerySchema, req.query);
  res.json(await service.listApplications(supabase, query));
};

export const listAllApplications = async (req: Request, res: Response<{ items: ApplicationResponse[] }>) => {
  const { supabase } = getAuth(req);
  res.json({ items: await service.listAllApplications(supabase) });
};

export const getApplication = async (req: Request, res: Response<ApplicationResponse>) => {
  const { supabase } = getAuth(req);
  res.json(await service.getApplication(supabase, parseId(req.params.id, 'Application')));
};

export const createApplication = async (req: Request, res: Response<ApplicationResponse>) => {
  const { supabase, userId } = getAuth(req);
  const created = await service.createApplication(supabase, userId, req.body as CreateApplicationInput);
  res.status(201).json(created);
};

export const updateApplication = async (req: Request, res: Response<ApplicationResponse>) => {
  const { supabase, userId } = getAuth(req);
  const id = parseId(req.params.id, 'Application');
  res.json(await service.updateApplication(supabase, userId, id, req.body as UpdateApplicationInput));
};

export const deleteApplication = async (req: Request, res: Response) => {
  const { supabase } = getAuth(req);
  await service.deleteApplication(supabase, parseId(req.params.id, 'Application'));
  res.status(204).end();
};
