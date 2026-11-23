export const APPLICATION_STATUSES = ['wishlist', 'applied', 'assessment', 'interview', 'offer', 'rejected'] as const;
export const JOB_TYPES = ['full_time', 'part_time', 'contract', 'internship', 'freelance'] as const;
export const WORK_MODES = ['remote', 'hybrid', 'onsite'] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export type JobType = (typeof JOB_TYPES)[number];
export type WorkMode = (typeof WORK_MODES)[number];

export interface CompanySummary {
  id: string;
  name: string;
}

export interface Application {
  id: string;
  jobTitle: string;
  company: CompanySummary;
  location: string | null;
  jobType: JobType | null;
  workMode: WorkMode | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  /** Only returned by the single-application endpoint. */
  jobDescription?: string | null;
  jobUrl: string | null;
  source: string | null;
  status: ApplicationStatus;
  /** YYYY-MM-DD */
  appliedAt: string | null;
  notes: string | null;
  resumeId: string | null;
  /** Only returned by the single-application endpoint. */
  resume?: { id: string; title: string } | null;
  /** Card order inside its Kanban column. */
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationInput {
  jobTitle: string;
  companyName: string;
  location: string | null;
  jobType: JobType | null;
  workMode: WorkMode | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  jobDescription: string | null;
  jobUrl: string | null;
  source: string | null;
  status: ApplicationStatus;
  appliedAt: string | null;
  notes: string | null;
  resumeId: string | null;
}

export type SortField = 'appliedAt' | 'createdAt' | 'updatedAt' | 'jobTitle' | 'company' | 'status' | 'salary';
export type SortOrder = 'asc' | 'desc';

export interface ApplicationQuery {
  search?: string;
  status?: ApplicationStatus;
  companyId?: string;
  location?: string;
  jobType?: JobType;
  workMode?: WorkMode;
  appliedFrom?: string;
  appliedTo?: string;
  sort: SortField;
  order: SortOrder;
  page: number;
  pageSize: number;
}
