import { z } from 'zod';

export const jobMatchSchema = z
  .object({
    jobDescription: z
      .string()
      .trim()
      .min(30, 'Paste a longer job description (at least a few sentences)')
      .max(20000, 'Job description is too long'),
    resumeId: z.uuid().optional(),
    resumeText: z.string().max(200_000).optional(),
  })
  .strict()
  .refine((data) => data.resumeId || data.resumeText?.trim(), {
    message: 'Choose a resume or paste your resume text',
    path: ['resumeId'],
  });

export type JobMatchInput = z.infer<typeof jobMatchSchema>;
