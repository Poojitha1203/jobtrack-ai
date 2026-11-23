import type { SupabaseClient } from '@supabase/supabase-js';
import { SORT_COLUMNS, type ApplicationStatus, type JobType, type WorkMode } from '../constants/application.js';
import { findOrCreateCompany } from './companies.service.js';
import { HttpError } from '../utils/HttpError.js';
import { escapeLike, sanitizeSearchTerm } from '../utils/parse.js';
import type { ApplicationResponse, PaginatedResponse } from '../types/api.js';
import type {
  CreateApplicationInput,
  ListApplicationsQuery,
  MoveApplicationInput,
  UpdateApplicationInput,
} from '../validators/application.schema.js';

interface ApplicationRow {
  id: string;
  company_id: string;
  company_name?: string; // from the application_list view
  company?: { id: string; name: string }; // from an embedded companies(...) select
  resume_id: string | null;
  resume?: { id: string; title: string } | null;
  job_title: string;
  location: string | null;
  job_type: JobType | null;
  work_mode: WorkMode | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  job_description?: string | null;
  job_url: string | null;
  source: string | null;
  status: ApplicationStatus;
  applied_at: string | null;
  notes: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

const BASE_COLUMNS =
  'id, company_id, resume_id, job_title, location, job_type, work_mode, salary_min, salary_max, salary_currency, ' +
  'job_url, source, status, applied_at, notes, position, created_at, updated_at';

const LIST_COLUMNS = `${BASE_COLUMNS}, company_name`;
const DETAIL_COLUMNS = `${BASE_COLUMNS}, job_description, company:companies(id, name), resume:resumes(id, title)`;

const NO_ROWS = 'PGRST116';

// The (resume_id, user_id) foreign key rejects another user's resume.
const unknownResume = () => new HttpError(400, 'That resume was not found', { resumeId: ['Choose one of your resumes'] });

function toResponse(row: ApplicationRow): ApplicationResponse {
  return {
    id: row.id,
    jobTitle: row.job_title,
    company: row.company ?? { id: row.company_id, name: row.company_name ?? '' },
    location: row.location,
    jobType: row.job_type,
    workMode: row.work_mode,
    salaryMin: row.salary_min,
    salaryMax: row.salary_max,
    salaryCurrency: row.salary_currency,
    ...(row.job_description !== undefined ? { jobDescription: row.job_description } : {}),
    jobUrl: row.job_url,
    source: row.source,
    status: row.status,
    appliedAt: row.applied_at,
    notes: row.notes,
    resumeId: row.resume_id,
    ...(row.resume !== undefined ? { resume: row.resume } : {}),
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toColumns(input: Omit<UpdateApplicationInput, 'companyName'>) {
  const map: Record<string, string> = {
    jobTitle: 'job_title',
    location: 'location',
    jobType: 'job_type',
    workMode: 'work_mode',
    salaryMin: 'salary_min',
    salaryMax: 'salary_max',
    salaryCurrency: 'salary_currency',
    jobDescription: 'job_description',
    jobUrl: 'job_url',
    source: 'source',
    status: 'status',
    appliedAt: 'applied_at',
    notes: 'notes',
    resumeId: 'resume_id',
  };
  const columns: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    const column = map[key];
    if (column && value !== undefined) columns[column] = value;
  }
  return columns;
}

export async function listApplications(
  supabase: SupabaseClient,
  query: ListApplicationsQuery,
): Promise<PaginatedResponse<ApplicationResponse>> {
  const { page, pageSize } = query;
  let request = supabase.from('application_list').select(LIST_COLUMNS, { count: 'exact' });

  if (query.search) {
    const term = sanitizeSearchTerm(query.search);
    if (term) {
      // "*" is PostgREST's wildcard inside .or() strings
      request = request.or(
        ['job_title', 'company_name', 'location', 'notes', 'source'].map((col) => `${col}.ilike.*${term}*`).join(','),
      );
    }
  }
  if (query.status) request = request.eq('status', query.status);
  if (query.companyId) request = request.eq('company_id', query.companyId);
  if (query.location) request = request.ilike('location', `%${escapeLike(query.location)}%`);
  if (query.jobType) request = request.eq('job_type', query.jobType);
  if (query.workMode) request = request.eq('work_mode', query.workMode);
  if (query.appliedFrom) request = request.gte('applied_at', query.appliedFrom);
  if (query.appliedTo) request = request.lte('applied_at', query.appliedTo);

  const from = (page - 1) * pageSize;
  const { data, error, count } = await request
    .order(SORT_COLUMNS[query.sort], { ascending: query.order === 'asc', nullsFirst: false })
    .order('created_at', { ascending: false }) // stable tie-breaker
    .range(from, from + pageSize - 1)
    .returns<ApplicationRow[]>();

  if (error) throw new Error(`Failed to list applications: ${error.message}`);

  return { items: data.map(toResponse), total: count ?? 0, page, pageSize };
}

export async function listAllApplications(supabase: SupabaseClient): Promise<ApplicationResponse[]> {
  const { data, error } = await supabase
    .from('application_list')
    .select(LIST_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(1000)
    .returns<ApplicationRow[]>();
  if (error) throw new Error(`Failed to load applications: ${error.message}`);
  return data.map(toResponse);
}

export async function getApplication(supabase: SupabaseClient, id: string): Promise<ApplicationResponse> {
  const { data, error } = await supabase
    .from('applications')
    .select(DETAIL_COLUMNS)
    .eq('id', id)
    .single<ApplicationRow>();
  // RLS hides other users' rows, so "not yours" and "doesn't exist" both look like no rows → 404.
  if (error?.code === NO_ROWS) throw new HttpError(404, 'Application not found');
  if (error) throw new Error(`Failed to load application: ${error.message}`);
  return toResponse(data);
}

export async function createApplication(
  supabase: SupabaseClient,
  userId: string,
  input: CreateApplicationInput,
): Promise<ApplicationResponse> {
  const { companyName, ...fields } = input;
  const company = await findOrCreateCompany(supabase, userId, companyName);

  const { data, error } = await supabase
    .from('applications')
    .insert({ ...toColumns(fields), user_id: userId, company_id: company.id })
    .select(DETAIL_COLUMNS)
    .single<ApplicationRow>();
  if (error?.code === '23503') throw unknownResume();
  if (error) throw new Error(`Failed to create application: ${error.message}`);
  return toResponse(data);
}

export async function updateApplication(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  input: UpdateApplicationInput,
): Promise<ApplicationResponse> {
  const { companyName, ...fields } = input;
  const columns = toColumns(fields);
  if (companyName !== undefined) {
    columns.company_id = (await findOrCreateCompany(supabase, userId, companyName)).id;
  }

  const { data, error } = await supabase
    .from('applications')
    .update(columns)
    .eq('id', id)
    .select(DETAIL_COLUMNS)
    .single<ApplicationRow>();
  if (error?.code === NO_ROWS) throw new HttpError(404, 'Application not found');
  if (error?.code === '23514') throw new HttpError(400, 'Maximum salary must be greater than or equal to minimum');
  if (error?.code === '23503') throw unknownResume();
  if (error) throw new Error(`Failed to update application: ${error.message}`);
  return toResponse(data);
}

export async function deleteApplication(supabase: SupabaseClient, id: string): Promise<void> {
  const { data, error } = await supabase.from('applications').delete().eq('id', id).select('id');
  if (error) throw new Error(`Failed to delete application: ${error.message}`);
  if (data.length === 0) throw new HttpError(404, 'Application not found');
}

export async function moveApplication(supabase: SupabaseClient, id: string, input: MoveApplicationInput): Promise<void> {
  const { error } = await supabase.rpc('move_application', {
    p_application_id: id,
    p_status: input.status,
    p_ordered_ids: input.orderedIds,
    p_applied_at: input.appliedAt ?? null,
  });
  if (error?.code === 'P0002') throw new HttpError(404, 'Application not found');
  if (error) throw new Error(`Failed to move application: ${error.message}`);
}
