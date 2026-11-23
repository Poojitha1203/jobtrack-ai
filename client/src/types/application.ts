// Domain types for job applications.
// These mirror the database columns we'll create in Phase 3 and will grow then.

// `as const` keeps the exact strings, so we can derive a union type from the array
// and also loop over the statuses in order (Kanban columns, charts, filters).
export const APPLICATION_STATUSES = [
  'wishlist',
  'applied',
  'assessment',
  'interview',
  'offer',
  'rejected',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export type WorkMode = 'remote' | 'hybrid' | 'onsite';

export interface Application {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  workMode: WorkMode;
  status: ApplicationStatus;
  /** ISO date string; null while the job is still on the wishlist. */
  appliedAt: string | null;
}
