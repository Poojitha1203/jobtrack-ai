// Domain types for interviews (expanded in Phase 6).

export type InterviewType = 'phone' | 'video' | 'onsite';

export interface Interview {
  id: string;
  applicationId: string;
  company: string;
  jobTitle: string;
  /** e.g. "Technical round 1", "HR round" */
  round: string;
  type: InterviewType;
  /** ISO date-time string */
  scheduledAt: string;
}
