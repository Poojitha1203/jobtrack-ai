import { z } from 'zod';
import { nonEmpty } from './common.js';

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;

const title = z.string().trim().min(1, 'Title is required').max(150, 'Must be 150 characters or fewer');

export const createResumeSchema = z
  .object({
    title,
    // "<user uuid>/<file uuid>.pdf" — the owner check happens in the controller.
    filePath: z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.pdf$/i, 'Invalid file path'),
    fileName: z.string().trim().min(1).max(255),
    fileSize: z.number().int().min(1).max(MAX_RESUME_BYTES, 'File must be 5 MB or smaller'),
    extractedText: z.string().max(200_000).nullable(),
    isDefault: z.boolean().optional(),
  })
  .strict();

export const updateResumeSchema = z
  .object({ title, isDefault: z.boolean() })
  .partial()
  .strict()
  .refine(nonEmpty, 'Send at least one field to update');

export type CreateResumeInput = z.infer<typeof createResumeSchema>;
export type UpdateResumeInput = z.infer<typeof updateResumeSchema>;
