import type { JobType, SortField, SortOrder, WorkMode } from '../types/application.ts';

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  freelance: 'Freelance',
};

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
};

export const SOURCE_SUGGESTIONS = [
  'LinkedIn',
  'Naukri',
  'Indeed',
  'Wellfound',
  'Instahyre',
  'Glassdoor',
  'Company website',
  'Referral',
  'Recruiter',
  'Job fair',
];

export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'SGD', 'AED'];

export interface SortOption {
  value: string;
  label: string;
  sort: SortField;
  order: SortOrder;
}

export const SORT_OPTIONS: SortOption[] = [
  { value: 'applied-desc', label: 'Applied: newest first', sort: 'appliedAt', order: 'desc' },
  { value: 'applied-asc', label: 'Applied: oldest first', sort: 'appliedAt', order: 'asc' },
  { value: 'created-desc', label: 'Recently added', sort: 'createdAt', order: 'desc' },
  { value: 'updated-desc', label: 'Recently updated', sort: 'updatedAt', order: 'desc' },
  { value: 'title-asc', label: 'Job title: A → Z', sort: 'jobTitle', order: 'asc' },
  { value: 'company-asc', label: 'Company: A → Z', sort: 'company', order: 'asc' },
  { value: 'salary-desc', label: 'Salary: highest first', sort: 'salary', order: 'desc' },
];

export const DEFAULT_SORT = SORT_OPTIONS[0]!;
