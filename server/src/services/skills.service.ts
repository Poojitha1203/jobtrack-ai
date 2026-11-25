import type { SupabaseClient } from '@supabase/supabase-js';
import { aggregateSkillGap, type SkillLevel, type UserSkillState } from '../lib/matching/skillGap.js';
import { getSkillCatalog } from './skillCatalog.service.js';
import { HttpError } from '../utils/HttpError.js';
import type { CatalogSkillResponse, SkillGapResponse, UserSkillResponse } from '../types/api.js';
import type { UpsertUserSkillInput } from '../validators/userSkill.schema.js';

const NO_ROWS = 'PGRST116';
const FOREIGN_KEY_VIOLATION = '23503';
const MAX_JOBS = 300;

interface UserSkillRow {
  skill_id: string;
  level: SkillLevel;
  progress: number;
  is_learning_goal: boolean;
  updated_at: string;
  skill: { id: string; name: string; category: string } | null;
}

const USER_SKILL_COLUMNS = 'skill_id, level, progress, is_learning_goal, updated_at, skill:skills(id, name, category)';

const toUserSkill = (row: UserSkillRow): UserSkillResponse => ({
  skillId: row.skill_id,
  name: row.skill?.name ?? 'Unknown skill',
  category: row.skill?.category ?? 'Other',
  level: row.level,
  progress: row.progress,
  isLearningGoal: row.is_learning_goal,
  updatedAt: row.updated_at,
});

export async function listCatalog(supabase: SupabaseClient): Promise<CatalogSkillResponse[]> {
  const catalog = await getSkillCatalog(supabase);
  return catalog
    .map(({ id, name, category }) => ({ id, name, category }))
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}

export async function listUserSkills(supabase: SupabaseClient): Promise<UserSkillResponse[]> {
  const { data, error } = await supabase
    .from('user_skills')
    .select(USER_SKILL_COLUMNS)
    .order('updated_at', { ascending: false })
    .returns<UserSkillRow[]>();
  if (error) throw new Error(`Failed to load your skills: ${error.message}`);
  return data.map(toUserSkill);
}

export async function upsertUserSkill(
  supabase: SupabaseClient,
  userId: string,
  skillId: string,
  input: UpsertUserSkillInput,
): Promise<UserSkillResponse> {
  const row: Record<string, unknown> = { user_id: userId, skill_id: skillId };
  if (input.level !== undefined) row.level = input.level;
  if (input.progress !== undefined) row.progress = input.progress;
  if (input.isLearningGoal !== undefined) row.is_learning_goal = input.isLearningGoal;

  // Insert, or update only the sent columns if you already have this skill.
  const { data, error } = await supabase
    .from('user_skills')
    .upsert(row, { onConflict: 'user_id,skill_id' })
    .select(USER_SKILL_COLUMNS)
    .single<UserSkillRow>();
  if (error?.code === FOREIGN_KEY_VIOLATION) throw new HttpError(404, 'Skill not found');
  if (error) throw new Error(`Failed to save skill: ${error.message}`);
  return toUserSkill(data);
}

export async function removeUserSkill(supabase: SupabaseClient, skillId: string): Promise<void> {
  const { data, error } = await supabase.from('user_skills').delete().eq('skill_id', skillId).select('skill_id');
  if (error) throw new Error(`Failed to remove skill: ${error.message}`);
  if (data.length === 0) throw new HttpError(404, 'Skill not found in your list');
}

export async function getSkillGap(supabase: SupabaseClient): Promise<SkillGapResponse> {
  const [catalog, userSkills, jobs, resume] = await Promise.all([
    getSkillCatalog(supabase),
    listUserSkills(supabase),
    supabase
      .from('applications')
      .select('job_description')
      .not('job_description', 'is', null)
      .order('created_at', { ascending: false })
      .limit(MAX_JOBS)
      .returns<{ job_description: string }[]>(),
    supabase
      .from('resumes')
      .select('title, extracted_text')
      .eq('is_default', true)
      .maybeSingle<{ title: string; extracted_text: string | null }>(),
  ]);

  if (catalog.length === 0) {
    throw new HttpError(503, 'The skill catalog is empty. Run the seed_skills migration in Supabase first.');
  }
  if (jobs.error) throw new Error(`Failed to load applications: ${jobs.error.message}`);
  if (resume.error && resume.error.code !== NO_ROWS) throw new Error(`Failed to load resume: ${resume.error.message}`);

  const states = new Map<string, UserSkillState>(
    userSkills.map((s) => [s.skillId, { level: s.level, progress: s.progress, isLearningGoal: s.isLearningGoal }]),
  );
  const descriptions = jobs.data.map((j) => j.job_description).filter((d) => d.trim().length > 0);

  return {
    ...aggregateSkillGap({
      jobDescriptions: descriptions,
      catalog,
      userSkills: states,
      resumeText: resume.data?.extracted_text ?? '',
    }),
    resumeTitle: resume.data?.title ?? null,
  };
}
