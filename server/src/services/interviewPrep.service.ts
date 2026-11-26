import type { SupabaseClient } from '@supabase/supabase-js';
import {
  QUESTION_CATEGORIES,
  type PracticeStatus,
  type QuestionCategory,
  type QuestionDifficulty,
} from '../constants/interviewPrep.js';
import { detectJobSkills } from '../lib/matching/analyzer.js';
import { recommendCategories } from '../lib/interviewPrep/recommend.js';
import { getSkillCatalog } from './skillCatalog.service.js';
import { listUserSkills } from './skills.service.js';
import { HttpError } from '../utils/HttpError.js';
import { getPlan } from './plan.service.js';
import type { InterviewQuestionResponse, PrepRecommendationsResponse, QuestionListResponse } from '../types/api.js';
import type { ListQuestionsQuery, RecommendationsQuery, SaveProgressInput } from '../validators/interviewPrep.schema.js';

const NO_ROWS = 'PGRST116';
const FOREIGN_KEY_VIOLATION = '23503';

interface ProgressRow {
  status: PracticeStatus;
  notes: string | null;
  last_practiced_at: string | null;
}

interface QuestionRow {
  id: string;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  question: string;
  suggested_answer: string;
  tags: string[];
  // RLS on user_question_progress means this only ever contains the caller's own row.
  progress: ProgressRow[];
}

const COLUMNS =
  'id, category, difficulty, question, suggested_answer, tags, progress:user_question_progress(status, notes, last_practiced_at)';

const toResponse = (row: QuestionRow): InterviewQuestionResponse => {
  const progress = row.progress[0];
  return {
    id: row.id,
    category: row.category,
    difficulty: row.difficulty,
    question: row.question,
    suggestedAnswer: row.suggested_answer,
    tags: row.tags,
    status: progress?.status ?? 'not_started',
    notes: progress?.notes ?? null,
    lastPracticedAt: progress?.last_practiced_at ?? null,
  };
};

export async function listQuestions(supabase: SupabaseClient, query: ListQuestionsQuery): Promise<QuestionListResponse> {
  const { data, error } = await supabase
    .from('interview_questions')
    .select(COLUMNS)
    .order('category')
    .order('difficulty')
    .order('created_at')
    .returns<QuestionRow[]>();
  if (error) throw new Error(`Failed to load questions: ${error.message}`);

  const { limits } = await getPlan(supabase);
  const allowed = limits.interviewDifficulties;
  const all = data.map(toResponse);

  // Stats always cover the whole bank, so progress bars don't change when you filter.
  const stats = {
    total: all.length,
    confident: all.filter((q) => q.status === 'confident').length,
    practicing: all.filter((q) => q.status === 'practicing').length,
    notStarted: all.filter((q) => q.status === 'not_started').length,
    byCategory: QUESTION_CATEGORIES.map((category) => {
      const inCategory = all.filter((q) => q.category === category);
      return {
        category,
        total: inCategory.length,
        confident: inCategory.filter((q) => q.status === 'confident').length,
        practicing: inCategory.filter((q) => q.status === 'practicing').length,
      };
    }).filter((c) => c.total > 0),
  };

  const search = query.search?.toLowerCase();
  const items = all.filter(
    (q) =>
      (!allowed || allowed.includes(q.difficulty)) &&
      (!query.categories || query.categories.includes(q.category)) &&
      (!query.difficulty || q.difficulty === query.difficulty) &&
      (!query.status || q.status === query.status) &&
      (!search || q.question.toLowerCase().includes(search) || q.tags.some((t) => t.toLowerCase().includes(search))),
  );

  const locked = allowed ? all.filter((q) => !allowed.includes(q.difficulty)).length : 0;
  return { items, stats, planLimited: locked > 0 ? { lockedQuestions: locked } : null };
}

export async function saveProgress(
  supabase: SupabaseClient,
  userId: string,
  questionId: string,
  input: SaveProgressInput,
): Promise<Pick<InterviewQuestionResponse, 'status' | 'notes' | 'lastPracticedAt'>> {
  const row: Record<string, unknown> = { user_id: userId, question_id: questionId };
  if (input.status !== undefined) {
    row.status = input.status;
    row.last_practiced_at = new Date().toISOString();
  }
  if (input.notes !== undefined) row.notes = input.notes;

  const { data, error } = await supabase
    .from('user_question_progress')
    .upsert(row, { onConflict: 'user_id,question_id' })
    .select('status, notes, last_practiced_at')
    .single<ProgressRow>();
  if (error?.code === FOREIGN_KEY_VIOLATION) throw new HttpError(404, 'Question not found');
  if (error) throw new Error(`Failed to save progress: ${error.message}`);
  return { status: data.status, notes: data.notes, lastPracticedAt: data.last_practiced_at };
}

export async function getRecommendations(
  supabase: SupabaseClient,
  query: RecommendationsQuery,
): Promise<PrepRecommendationsResponse> {
  let jobTitle = query.jobTitle ?? null;
  let company: string | null = null;
  let jobSkills: string[] = [];

  if (query.applicationId) {
    const { data, error } = await supabase
      .from('applications')
      .select('job_title, job_description, company:companies(name)')
      .eq('id', query.applicationId)
      .single<{ job_title: string; job_description: string | null; company: { name: string } | null }>();
    if (error?.code === NO_ROWS) throw new HttpError(404, 'Application not found');
    if (error) throw new Error(`Failed to load application: ${error.message}`);

    jobTitle = data.job_title;
    company = data.company?.name ?? null;
    if (data.job_description) {
      const catalog = await getSkillCatalog(supabase);
      jobSkills = detectJobSkills(data.job_description, catalog).map((d) => d.skill.name);
    }
  }

  const userSkills = jobTitle ? [] : (await listUserSkills(supabase)).map((s) => s.name);

  return {
    context: jobTitle ? { jobTitle, company } : null,
    recommendations: recommendCategories({ jobTitle, jobSkills, userSkills }),
  };
}
