import { z } from 'zod';
import { INTERVIEW_RESULTS, INTERVIEW_TYPES } from '../constants/interview.js';
import { nonEmpty, optionalHttpUrl, optionalQuery, optionalText, withDefault } from './common.js';

const interviewFields = z.object({
  applicationId: z.uuid('Choose an application'),
  round: z.string().trim().min(1, 'Round is required').max(100, 'Must be 100 characters or fewer'),
  interviewType: z.enum(INTERVIEW_TYPES),
  // Must include a time-zone offset (e.g. "Z" or "+05:30") so the moment is unambiguous.
  scheduledAt: z.iso.datetime({ offset: true, error: 'Enter a valid date and time' }),
  durationMinutes: z.number().int('Must be a whole number').min(5, 'Minimum 5 minutes').max(600, 'Maximum 10 hours').nullable(),
  meetingLink: optionalHttpUrl,
  preparationNotes: optionalText(5000),
  feedback: optionalText(5000),
  result: z.enum(INTERVIEW_RESULTS),
});

export const createInterviewSchema = interviewFields
  .partial()
  .required({ applicationId: true, round: true, scheduledAt: true })
  .strict();

export const updateInterviewSchema = interviewFields
  .partial()
  .strict()
  .refine(nonEmpty, 'Send at least one field to update');

export const listInterviewsQuerySchema = z.object({
  from: optionalQuery(z.iso.datetime({ offset: true })),
  to: optionalQuery(z.iso.datetime({ offset: true })),
  applicationId: optionalQuery(z.uuid()),
  result: optionalQuery(z.enum(INTERVIEW_RESULTS)),
  order: withDefault(z.enum(['asc', 'desc']).default('asc')),
  limit: withDefault(z.coerce.number().int().min(1).max(500).default(200)),
});

export type CreateInterviewInput = z.infer<typeof createInterviewSchema>;
export type UpdateInterviewInput = z.infer<typeof updateInterviewSchema>;
export type ListInterviewsQuery = z.infer<typeof listInterviewsQuerySchema>;
