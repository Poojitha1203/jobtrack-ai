// Allowed values — must match the Postgres enums in supabase/migrations.

export const APPLICATION_STATUSES = ['wishlist', 'applied', 'assessment', 'interview', 'offer', 'rejected'] as const;
export const JOB_TYPES = ['full_time', 'part_time', 'contract', 'internship', 'freelance'] as const;
export const WORK_MODES = ['remote', 'hybrid', 'onsite'] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export type JobType = (typeof JOB_TYPES)[number];
export type WorkMode = (typeof WORK_MODES)[number];
export const SORT_COLUMNS = {
  appliedAt: 'applied_at',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  jobTitle: 'job_title',
  company: 'company_name',
  status: 'status',
  salary: 'salary_max',
} as const;

export type SortField = keyof typeof SORT_COLUMNS;
