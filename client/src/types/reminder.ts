import type { CompanySummary } from './application.ts';

export const REMINDER_TYPES = ['follow_up', 'interview', 'deadline', 'custom'] as const;
export type ReminderType = (typeof REMINDER_TYPES)[number];

export interface Reminder {
  id: string;
  type: ReminderType;
  title: string;
  notes: string | null;
  /** ISO date-time (UTC) */
  remindAt: string;
  isCompleted: boolean;
  completedAt: string | null;
  applicationId: string | null;
  interviewId: string | null;
  application: { id: string; jobTitle: string; company: CompanySummary } | null;
  interview: { id: string; round: string; scheduledAt: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderInput {
  type: ReminderType;
  title: string;
  notes: string | null;
  remindAt: string;
  applicationId: string | null;
  interviewId: string | null;
}

export interface ReminderQuery {
  status?: 'open' | 'completed' | 'all';
  from?: string;
  to?: string;
  applicationId?: string;
  order?: 'asc' | 'desc';
  limit?: number;
}
