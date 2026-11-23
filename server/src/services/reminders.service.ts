import type { SupabaseClient } from '@supabase/supabase-js';
import { HttpError } from '../utils/HttpError.js';
import type { ReminderResponse } from '../types/api.js';
import type {
  CreateReminderInput,
  ListRemindersQuery,
  ReminderType,
  UpdateReminderInput,
} from '../validators/reminder.schema.js';

const NO_ROWS = 'PGRST116';
const FOREIGN_KEY_VIOLATION = '23503';

interface ReminderRow {
  id: string;
  type: ReminderType;
  title: string;
  notes: string | null;
  remind_at: string;
  is_completed: boolean;
  completed_at: string | null;
  application_id: string | null;
  interview_id: string | null;
  created_at: string;
  updated_at: string;
  application: { id: string; job_title: string; company: { id: string; name: string } } | null;
  interview: { id: string; round: string; scheduled_at: string } | null;
}

const COLUMNS =
  'id, type, title, notes, remind_at, is_completed, completed_at, application_id, interview_id, created_at, updated_at, ' +
  'application:applications(id, job_title, company:companies(id, name)), ' +
  'interview:interviews(id, round, scheduled_at)';

const toResponse = (row: ReminderRow): ReminderResponse => ({
  id: row.id,
  type: row.type,
  title: row.title,
  notes: row.notes,
  remindAt: row.remind_at,
  isCompleted: row.is_completed,
  completedAt: row.completed_at,
  applicationId: row.application_id,
  interviewId: row.interview_id,
  application: row.application
    ? { id: row.application.id, jobTitle: row.application.job_title, company: row.application.company }
    : null,
  interview: row.interview
    ? { id: row.interview.id, round: row.interview.round, scheduledAt: row.interview.scheduled_at }
    : null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

function toColumns(input: UpdateReminderInput) {
  const map: Record<string, string> = {
    type: 'type',
    title: 'title',
    notes: 'notes',
    remindAt: 'remind_at',
    applicationId: 'application_id',
    interviewId: 'interview_id',
    isCompleted: 'is_completed',
  };
  const columns: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    const column = map[key];
    if (column && value !== undefined) columns[column] = value;
  }
  if (input.isCompleted !== undefined) columns.completed_at = input.isCompleted ? new Date().toISOString() : null;
  return columns;
}

const unknownLink = () =>
  new HttpError(400, 'The linked application or interview was not found', {
    applicationId: ['Choose one of your applications'],
  });

export async function listReminders(supabase: SupabaseClient, query: ListRemindersQuery): Promise<ReminderResponse[]> {
  let request = supabase.from('reminders').select(COLUMNS);
  if (query.status !== 'all') request = request.eq('is_completed', query.status === 'completed');
  if (query.from) request = request.gte('remind_at', query.from);
  if (query.to) request = request.lt('remind_at', query.to);
  if (query.applicationId) request = request.eq('application_id', query.applicationId);

  const { data, error } = await request
    .order('remind_at', { ascending: query.order === 'asc' })
    .limit(query.limit)
    .returns<ReminderRow[]>();
  if (error) throw new Error(`Failed to load reminders: ${error.message}`);
  return data.map(toResponse);
}

export async function createReminder(
  supabase: SupabaseClient,
  userId: string,
  input: CreateReminderInput,
): Promise<ReminderResponse> {
  const { data, error } = await supabase
    .from('reminders')
    .insert({ ...toColumns(input), user_id: userId })
    .select(COLUMNS)
    .single<ReminderRow>();
  if (error?.code === FOREIGN_KEY_VIOLATION) throw unknownLink();
  if (error) throw new Error(`Failed to create reminder: ${error.message}`);
  return toResponse(data);
}

export async function updateReminder(
  supabase: SupabaseClient,
  id: string,
  input: UpdateReminderInput,
): Promise<ReminderResponse> {
  const { data, error } = await supabase
    .from('reminders')
    .update(toColumns(input))
    .eq('id', id)
    .select(COLUMNS)
    .single<ReminderRow>();
  if (error?.code === NO_ROWS) throw new HttpError(404, 'Reminder not found');
  if (error?.code === FOREIGN_KEY_VIOLATION) throw unknownLink();
  if (error) throw new Error(`Failed to update reminder: ${error.message}`);
  return toResponse(data);
}

export async function deleteReminder(supabase: SupabaseClient, id: string): Promise<void> {
  const { data, error } = await supabase.from('reminders').delete().eq('id', id).select('id');
  if (error) throw new Error(`Failed to delete reminder: ${error.message}`);
  if (data.length === 0) throw new HttpError(404, 'Reminder not found');
}
