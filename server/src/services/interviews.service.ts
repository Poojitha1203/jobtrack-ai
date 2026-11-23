import type { SupabaseClient } from '@supabase/supabase-js';
import type { ApplicationStatus } from '../constants/application.js';
import type { InterviewResult, InterviewType } from '../constants/interview.js';
import { HttpError } from '../utils/HttpError.js';
import type { InterviewResponse } from '../types/api.js';
import type {
  CreateInterviewInput,
  ListInterviewsQuery,
  UpdateInterviewInput,
} from '../validators/interview.schema.js';

const NO_ROWS = 'PGRST116';
const FOREIGN_KEY_VIOLATION = '23503';

interface InterviewRow {
  id: string;
  application_id: string;
  round: string;
  interview_type: InterviewType;
  scheduled_at: string;
  duration_minutes: number | null;
  meeting_link: string | null;
  preparation_notes: string | null;
  feedback: string | null;
  result: InterviewResult;
  created_at: string;
  updated_at: string;
  application: {
    id: string;
    job_title: string;
    status: ApplicationStatus;
    company: { id: string; name: string };
  };
}

const COLUMNS =
  'id, application_id, round, interview_type, scheduled_at, duration_minutes, meeting_link, preparation_notes, ' +
  'feedback, result, created_at, updated_at, ' +
  'application:applications!inner(id, job_title, status, company:companies(id, name))';

const toResponse = (row: InterviewRow): InterviewResponse => ({
  id: row.id,
  applicationId: row.application_id,
  application: {
    id: row.application.id,
    jobTitle: row.application.job_title,
    status: row.application.status,
    company: row.application.company,
  },
  round: row.round,
  interviewType: row.interview_type,
  scheduledAt: row.scheduled_at,
  durationMinutes: row.duration_minutes,
  meetingLink: row.meeting_link,
  preparationNotes: row.preparation_notes,
  feedback: row.feedback,
  result: row.result,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

function toColumns(input: UpdateInterviewInput) {
  const map: Record<string, string> = {
    applicationId: 'application_id',
    round: 'round',
    interviewType: 'interview_type',
    scheduledAt: 'scheduled_at',
    durationMinutes: 'duration_minutes',
    meetingLink: 'meeting_link',
    preparationNotes: 'preparation_notes',
    feedback: 'feedback',
    result: 'result',
  };
  const columns: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    const column = map[key];
    if (column && value !== undefined) columns[column] = value;
  }
  return columns;
}

// The (application_id, user_id) foreign key rejects another user's application id.
const unknownApplication = () =>
  new HttpError(400, 'That application was not found', { applicationId: ['Choose one of your applications'] });

export async function listInterviews(supabase: SupabaseClient, query: ListInterviewsQuery): Promise<InterviewResponse[]> {
  let request = supabase.from('interviews').select(COLUMNS);
  if (query.from) request = request.gte('scheduled_at', query.from);
  if (query.to) request = request.lt('scheduled_at', query.to);
  if (query.applicationId) request = request.eq('application_id', query.applicationId);
  if (query.result) request = request.eq('result', query.result);

  const { data, error } = await request
    .order('scheduled_at', { ascending: query.order === 'asc' })
    .limit(query.limit)
    .returns<InterviewRow[]>();
  if (error) throw new Error(`Failed to load interviews: ${error.message}`);
  return data.map(toResponse);
}

export async function getInterview(supabase: SupabaseClient, id: string): Promise<InterviewResponse> {
  const { data, error } = await supabase.from('interviews').select(COLUMNS).eq('id', id).single<InterviewRow>();
  if (error?.code === NO_ROWS) throw new HttpError(404, 'Interview not found');
  if (error) throw new Error(`Failed to load interview: ${error.message}`);
  return toResponse(data);
}

export async function createInterview(
  supabase: SupabaseClient,
  userId: string,
  input: CreateInterviewInput,
): Promise<InterviewResponse> {
  const { data, error } = await supabase
    .from('interviews')
    .insert({ ...toColumns(input), user_id: userId })
    .select(COLUMNS)
    .single<InterviewRow>();
  if (error?.code === FOREIGN_KEY_VIOLATION) throw unknownApplication();
  if (error) throw new Error(`Failed to create interview: ${error.message}`);
  return toResponse(data);
}

export async function updateInterview(
  supabase: SupabaseClient,
  id: string,
  input: UpdateInterviewInput,
): Promise<InterviewResponse> {
  const { data, error } = await supabase
    .from('interviews')
    .update(toColumns(input))
    .eq('id', id)
    .select(COLUMNS)
    .single<InterviewRow>();
  if (error?.code === NO_ROWS) throw new HttpError(404, 'Interview not found');
  if (error?.code === FOREIGN_KEY_VIOLATION) throw unknownApplication();
  if (error) throw new Error(`Failed to update interview: ${error.message}`);
  return toResponse(data);
}

export async function deleteInterview(supabase: SupabaseClient, id: string): Promise<void> {
  const { data, error } = await supabase.from('interviews').delete().eq('id', id).select('id');
  if (error) throw new Error(`Failed to delete interview: ${error.message}`);
  if (data.length === 0) throw new HttpError(404, 'Interview not found');
}
