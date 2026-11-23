import { z } from 'zod';
import { nonEmpty, optionalQuery, optionalText, withDefault } from './common.js';

export const REMINDER_TYPES = ['interview', 'follow_up', 'deadline', 'custom'] as const;
export type ReminderType = (typeof REMINDER_TYPES)[number];

const reminderFields = z.object({
  type: z.enum(REMINDER_TYPES),
  title: z.string().trim().min(1, 'Title is required').max(150, 'Must be 150 characters or fewer'),
  notes: optionalText(2000),
  remindAt: z.iso.datetime({ offset: true, error: 'Enter a valid date and time' }),
  applicationId: z.uuid().nullable(),
  interviewId: z.uuid().nullable(),
  isCompleted: z.boolean(),
});

export const createReminderSchema = reminderFields
  .omit({ isCompleted: true })
  .partial()
  .required({ title: true, remindAt: true })
  .strict();

export const updateReminderSchema = reminderFields.partial().strict().refine(nonEmpty, 'Send at least one field to update');

export const listRemindersQuerySchema = z.object({
  status: withDefault(z.enum(['open', 'completed', 'all']).default('open')),
  from: optionalQuery(z.iso.datetime({ offset: true })),
  to: optionalQuery(z.iso.datetime({ offset: true })),
  applicationId: optionalQuery(z.uuid()),
  order: withDefault(z.enum(['asc', 'desc']).default('asc')),
  limit: withDefault(z.coerce.number().int().min(1).max(500).default(200)),
});

export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;
export type ListRemindersQuery = z.infer<typeof listRemindersQuerySchema>;
