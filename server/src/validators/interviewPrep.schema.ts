import { z } from 'zod';
import { PRACTICE_STATUSES, QUESTION_CATEGORIES, QUESTION_DIFFICULTIES } from '../constants/interviewPrep.js';
import { nonEmpty, optionalQuery, optionalText } from './common.js';

export const listQuestionsQuerySchema = z.object({
  // Comma-separated, e.g. ?categories=react,css
  categories: optionalQuery(
    z
      .string()
      .transform((value) => value.split(',').map((c) => c.trim()).filter(Boolean))
      .pipe(z.array(z.enum(QUESTION_CATEGORIES)).min(1)),
  ),
  difficulty: optionalQuery(z.enum(QUESTION_DIFFICULTIES)),
  status: optionalQuery(z.enum(PRACTICE_STATUSES)),
  search: optionalQuery(z.string().trim().max(100)),
});

export const recommendationsQuerySchema = z.object({
  applicationId: optionalQuery(z.uuid()),
  jobTitle: optionalQuery(z.string().trim().max(150)),
});

export const saveProgressSchema = z
  .object({
    status: z.enum(PRACTICE_STATUSES),
    notes: optionalText(5000),
  })
  .partial()
  .strict()
  .refine(nonEmpty, 'Send a status or notes');

export type ListQuestionsQuery = z.infer<typeof listQuestionsQuerySchema>;
export type RecommendationsQuery = z.infer<typeof recommendationsQuerySchema>;
export type SaveProgressInput = z.infer<typeof saveProgressSchema>;
