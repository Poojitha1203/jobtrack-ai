import type { ApplicationStatus, CompanySummary } from './application.ts';

export const INTERVIEW_TYPES = ['phone', 'video', 'onsite'] as const;
export const INTERVIEW_RESULTS = ['pending', 'passed', 'failed', 'cancelled'] as const;

export type InterviewType = (typeof INTERVIEW_TYPES)[number];
export type InterviewResult = (typeof INTERVIEW_RESULTS)[number];

export interface Interview {
  id: string;
  applicationId: string;
  application: {
    id: string;
    jobTitle: string;
    status: ApplicationStatus;
    company: CompanySummary;
  };
  round: string;
  interviewType: InterviewType;
  /** ISO date-time (UTC) */
  scheduledAt: string;
  durationMinutes: number | null;
  meetingLink: string | null;
  preparationNotes: string | null;
  feedback: string | null;
  result: InterviewResult;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewInput {
  applicationId: string;
  round: string;
  interviewType: InterviewType;
  scheduledAt: string;
  durationMinutes: number | null;
  meetingLink: string | null;
  preparationNotes: string | null;
  feedback: string | null;
  result: InterviewResult;
}

export interface InterviewQuery {
  from?: string;
  to?: string;
  applicationId?: string;
  result?: InterviewResult;
  order?: 'asc' | 'desc';
  limit?: number;
}
