import type { SupabaseClient } from '@supabase/supabase-js';
import { analyzeMatch } from '../lib/matching/analyzer.js';
import { getSkillCatalog } from './skillCatalog.service.js';
import { HttpError } from '../utils/HttpError.js';
import type { JobMatchResponse } from '../types/api.js';
import type { JobMatchInput } from '../validators/jobMatch.schema.js';

const NO_ROWS = 'PGRST116';

async function loadResume(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from('resumes')
    .select('id, title, extracted_text')
    .eq('id', id)
    .single<{ id: string; title: string; extracted_text: string | null }>();
  if (error?.code === NO_ROWS) throw new HttpError(404, 'Resume not found');
  if (error) throw new Error(`Failed to load resume: ${error.message}`);
  return data;
}

async function loadProfileSkills(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_skills')
    .select('skill:skills(name)')
    .returns<{ skill: { name: string } | null }[]>();
  if (error) throw new Error(`Failed to load your skills: ${error.message}`);
  return data.flatMap((row) => (row.skill ? [row.skill.name] : []));
}

export async function analyzeJobMatch(supabase: SupabaseClient, input: JobMatchInput): Promise<JobMatchResponse> {
  const [catalog, profileSkills, resume] = await Promise.all([
    getSkillCatalog(supabase),
    loadProfileSkills(supabase),
    input.resumeId ? loadResume(supabase, input.resumeId) : Promise.resolve(null),
  ]);

  if (catalog.length === 0) {
    throw new HttpError(503, 'The skill catalog is empty. Run the seed_skills migration in Supabase first.');
  }

  const resumeText = resume ? (resume.extracted_text ?? '') : (input.resumeText ?? '');
  const result = analyzeMatch({ jobDescription: input.jobDescription, resumeText, profileSkills, catalog });

  return {
    ...result,
    resume: resume ? { id: resume.id, title: resume.title, hasText: Boolean(resume.extracted_text?.trim()) } : null,
    catalogSize: catalog.length,
  };
}
