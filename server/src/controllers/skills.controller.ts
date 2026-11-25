import type { Request, Response } from 'express';
import { getAuth } from '../middleware/requireAuth.js';
import * as service from '../services/skills.service.js';
import { parseId } from '../utils/parse.js';
import type { UpsertUserSkillInput } from '../validators/userSkill.schema.js';
import type { CatalogSkillResponse, SkillGapResponse, UserSkillResponse } from '../types/api.js';

export const listCatalog = async (req: Request, res: Response<{ items: CatalogSkillResponse[] }>) => {
  const { supabase } = getAuth(req);
  res.json({ items: await service.listCatalog(supabase) });
};

export const listMine = async (req: Request, res: Response<{ items: UserSkillResponse[] }>) => {
  const { supabase } = getAuth(req);
  res.json({ items: await service.listUserSkills(supabase) });
};

export const upsertMine = async (req: Request, res: Response<UserSkillResponse>) => {
  const { supabase, userId } = getAuth(req);
  const skillId = parseId(req.params.skillId, 'Skill');
  res.json(await service.upsertUserSkill(supabase, userId, skillId, req.body as UpsertUserSkillInput));
};

export const removeMine = async (req: Request, res: Response) => {
  const { supabase } = getAuth(req);
  await service.removeUserSkill(supabase, parseId(req.params.skillId, 'Skill'));
  res.status(204).end();
};

export const getGap = async (req: Request, res: Response<SkillGapResponse>) => {
  const { supabase } = getAuth(req);
  res.json(await service.getSkillGap(supabase));
};
