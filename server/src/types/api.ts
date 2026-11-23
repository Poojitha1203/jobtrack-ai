import type { ApplicationStatus, JobType, WorkMode } from '../constants/application.js';

export interface ApiErrorResponse {
  error: {
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface HealthResponse {
  status: 'ok';
  service: string;
  environment: string;
  uptimeSeconds: number;
  timestamp: string;
}

export type UserRole = 'user' | 'admin';

export interface ProfileResponse {
  id: string;
  email: string;
  fullName: string;
  headline: string | null;
  location: string | null;
  weeklyGoal: number;
  role: UserRole;
  createdAt: string;
}

export interface CompanySummary {
  id: string;
  name: string;
}

export interface ApplicationResponse {
  id: string;
  jobTitle: string;
  company: CompanySummary;
  location: string | null;
  jobType: JobType | null;
  workMode: WorkMode | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  jobDescription?: string | null;
  jobUrl: string | null;
  source: string | null;
  status: ApplicationStatus;
  appliedAt: string | null;
  notes: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
