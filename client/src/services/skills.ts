import { apiRequest } from './api.ts';
import type { CatalogSkill, SkillGapReport, UserSkill, UserSkillChanges } from '../types/skill.ts';

export const listSkillCatalog = () => apiRequest<{ items: CatalogSkill[] }>('/skills').then((res) => res.items);

export const listMySkills = () => apiRequest<{ items: UserSkill[] }>('/skills/mine').then((res) => res.items);

export const saveMySkill = (skillId: string, changes: UserSkillChanges) =>
  apiRequest<UserSkill>(`/skills/mine/${encodeURIComponent(skillId)}`, { method: 'PUT', body: JSON.stringify(changes) });

export const removeMySkill = (skillId: string) =>
  apiRequest<void>(`/skills/mine/${encodeURIComponent(skillId)}`, { method: 'DELETE' });

export const getSkillGap = () => apiRequest<SkillGapReport>('/skills/gap');
