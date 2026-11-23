import { apiRequest } from './api.ts';
import { supabase } from '../lib/supabase.ts';
import { extractPdfText } from '../lib/pdfText.ts';
import type { Resume } from '../types/resume.ts';

const BUCKET = 'resumes';
export const MAX_RESUME_BYTES = 5 * 1024 * 1024;

export type UploadStep = 'reading' | 'uploading' | 'saving';

export const listResumes = () => apiRequest<{ items: Resume[] }>('/resumes').then((res) => res.items);

export const updateResume = (id: string, changes: { title?: string; isDefault?: boolean }) =>
  apiRequest<Resume>(`/resumes/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(changes) });

export const deleteResume = (id: string) =>
  apiRequest<void>(`/resumes/${encodeURIComponent(id)}`, { method: 'DELETE' });

/**
 * 1. Read the text out of the PDF (in the browser).
 * 2. Upload the file straight to Supabase Storage (storage policies only allow the user's own folder).
 * 3. Save the metadata + text through our API. If that fails, the uploaded file is removed again.
 */
export async function uploadResume(
  file: File,
  title: string,
  userId: string,
  onStep: (step: UploadStep) => void,
): Promise<Resume> {
  onStep('reading');
  let extractedText: string | null;
  try {
    extractedText = (await extractPdfText(file)).slice(0, 200_000) || null;
  } catch {
    throw new Error("This PDF couldn't be read. It may be damaged or password-protected.");
  }

  onStep('uploading');
  const filePath = `${userId}/${crypto.randomUUID()}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { contentType: 'application/pdf', upsert: false });
  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  onStep('saving');
  try {
    return await apiRequest<Resume>('/resumes', {
      method: 'POST',
      body: JSON.stringify({ title, filePath, fileName: file.name, fileSize: file.size, extractedText }),
    });
  } catch (error) {
    await supabase.storage.from(BUCKET).remove([filePath]);
    throw error;
  }
}

/** A short-lived private link to view the PDF (the bucket itself is not public). */
export async function getResumeViewUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(filePath, 60);
  if (error) throw new Error(`Couldn't open the file: ${error.message}`);
  return data.signedUrl;
}
