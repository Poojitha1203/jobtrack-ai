import type { SupabaseClient } from '@supabase/supabase-js';
import { HttpError } from '../utils/HttpError.js';
import { countRows, getPlan } from './plan.service.js';
import { PLAN_LIMIT } from '../constants/plans.js';
import type { ResumeResponse } from '../types/api.js';
import type { CreateResumeInput, UpdateResumeInput } from '../validators/resume.schema.js';

const NO_ROWS = 'PGRST116';
const BUCKET = 'resumes';

interface ResumeRow {
  id: string;
  title: string;
  file_path: string;
  file_name: string;
  file_size: number;
  extracted_text: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  applications?: { count: number }[];
}

const COLUMNS =
  'id, title, file_path, file_name, file_size, extracted_text, is_default, created_at, updated_at, applications(count)';

const toResponse = (row: ResumeRow): ResumeResponse => ({
  id: row.id,
  title: row.title,
  filePath: row.file_path,
  fileName: row.file_name,
  fileSize: row.file_size,
  extractedText: row.extracted_text,
  isDefault: row.is_default,
  applicationCount: row.applications?.[0]?.count ?? 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Only one default resume per user (enforced by a partial unique index), so clear the old one first.
async function clearDefault(supabase: SupabaseClient, exceptId?: string) {
  let request = supabase.from('resumes').update({ is_default: false }).eq('is_default', true);
  if (exceptId) request = request.neq('id', exceptId);
  const { error } = await request;
  if (error) throw new Error(`Failed to update default resume: ${error.message}`);
}

export async function listResumes(supabase: SupabaseClient): Promise<ResumeResponse[]> {
  const { data, error } = await supabase
    .from('resumes')
    .select(COLUMNS)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
    .returns<ResumeRow[]>();
  if (error) throw new Error(`Failed to load resumes: ${error.message}`);
  return data.map(toResponse);
}

export async function createResume(
  supabase: SupabaseClient,
  userId: string,
  input: CreateResumeInput,
): Promise<ResumeResponse> {
  if (!input.filePath.startsWith(`${userId}/`)) throw new HttpError(403, 'You can only register files in your own folder');

  const { limits } = await getPlan(supabase);
  if (limits.resumes !== null && (await countRows(supabase, 'resumes')) >= limits.resumes) {
    // Remove the file the browser already uploaded, so it doesn't use storage for nothing.
    await supabase.storage.from(BUCKET).remove([input.filePath]);
    throw new HttpError(
      403,
      `The Free plan includes ${limits.resumes} resume. Upgrade to Pro to keep multiple versions, or delete your current one first.`,
      undefined,
      PLAN_LIMIT,
    );
  }

  const { count } = await supabase.from('resumes').select('id', { count: 'exact', head: true });
  const makeDefault = input.isDefault === true || count === 0;
  if (makeDefault) await clearDefault(supabase);

  const { data, error } = await supabase
    .from('resumes')
    .insert({
      user_id: userId,
      title: input.title,
      file_path: input.filePath,
      file_name: input.fileName,
      file_size: input.fileSize,
      extracted_text: input.extractedText,
      is_default: makeDefault,
    })
    .select(COLUMNS)
    .single<ResumeRow>();
  if (error) throw new Error(`Failed to save resume: ${error.message}`);
  return toResponse(data);
}

export async function updateResume(supabase: SupabaseClient, id: string, input: UpdateResumeInput): Promise<ResumeResponse> {
  if (input.isDefault === true) await clearDefault(supabase, id);

  const columns: Record<string, unknown> = {};
  if (input.title !== undefined) columns.title = input.title;
  if (input.isDefault !== undefined) columns.is_default = input.isDefault;

  const { data, error } = await supabase.from('resumes').update(columns).eq('id', id).select(COLUMNS).single<ResumeRow>();
  if (error?.code === NO_ROWS) throw new HttpError(404, 'Resume not found');
  if (error) throw new Error(`Failed to update resume: ${error.message}`);
  return toResponse(data);
}

export async function deleteResume(supabase: SupabaseClient, id: string): Promise<void> {
  const { data, error } = await supabase.from('resumes').delete().eq('id', id).select('file_path');
  if (error) throw new Error(`Failed to delete resume: ${error.message}`);
  const deleted = data[0];
  if (!deleted) throw new HttpError(404, 'Resume not found');

  // Applications that used this resume keep working: their resume_id is set to NULL by the foreign key.
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([deleted.file_path as string]);
  if (storageError) console.warn(`Resume row deleted but file removal failed: ${storageError.message}`);
}
