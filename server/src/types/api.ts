import type { ApplicationStatus, JobType, WorkMode } from '../constants/application.js';
import type { InterviewResult, InterviewType } from '../constants/interview.js';
import type { ReminderType } from '../validators/reminder.schema.js';

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

export interface CompanyResponse {
  id: string;
  name: string;
  website: string | null;
  location: string | null;
  industry: string | null;
  contactName: string | null;
  contactEmail: string | null;
  notes: string | null;
  applicationCount: number;
  createdAt: string;
  updatedAt: string;
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

export interface InterviewResponse {
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
  scheduledAt: string;
  durationMinutes: number | null;
  meetingLink: string | null;
  preparationNotes: string | null;
  feedback: string | null;
  result: InterviewResult;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderResponse {
  id: string;
  type: ReminderType;
  title: string;
  notes: string | null;
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

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
