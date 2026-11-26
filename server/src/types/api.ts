import type { ApplicationStatus, JobType, WorkMode } from '../constants/application.js';
import type { InterviewResult, InterviewType } from '../constants/interview.js';
import type { ReminderType } from '../validators/reminder.schema.js';
import type { MatchResult } from '../lib/matching/analyzer.js';
import type { SkillGapResult, SkillLevel } from '../lib/matching/skillGap.js';
import type { PracticeStatus, QuestionCategory, QuestionDifficulty } from '../constants/interviewPrep.js';
import type { CategoryRecommendation } from '../lib/interviewPrep/recommend.js';
import type { PlanId, PlanLimits } from '../constants/plans.js';

export interface ApiErrorResponse {
  error: {
    message: string;
    details?: Record<string, string[]>;
    code?: string;
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
  resumeId: string | null;
  /** Only included by GET /applications/:id. */
  resume?: { id: string; title: string } | null;
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

export interface ResumeResponse {
  id: string;
  title: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  extractedText: string | null;
  isDefault: boolean;
  applicationCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobMatchResponse extends MatchResult {
  resume: { id: string; title: string; hasText: boolean } | null;
  catalogSize: number;
}

export interface CatalogSkillResponse {
  id: string;
  name: string;
  category: string;
}

export interface UserSkillResponse {
  skillId: string;
  name: string;
  category: string;
  level: SkillLevel;
  progress: number;
  isLearningGoal: boolean;
  updatedAt: string;
}

export interface SkillGapResponse extends SkillGapResult {
  resumeTitle: string | null;
  planLimited: { hiddenGaps: number } | null;
}

export interface InterviewQuestionResponse {
  id: string;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  question: string;
  suggestedAnswer: string;
  tags: string[];
  status: PracticeStatus;
  notes: string | null;
  lastPracticedAt: string | null;
}

export interface QuestionListResponse {
  items: InterviewQuestionResponse[];
  stats: {
    total: number;
    confident: number;
    practicing: number;
    notStarted: number;
    byCategory: { category: QuestionCategory; total: number; confident: number; practicing: number }[];
  };
  planLimited: { lockedQuestions: number } | null;
}

export interface PrepRecommendationsResponse {
  context: { jobTitle: string; company: string | null } | null;
  recommendations: CategoryRecommendation[];
}

export interface BillingOverviewResponse {
  plan: PlanId;
  subscription: {
    status: 'active' | 'cancelled' | 'expired';
    currentPeriodStart: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  limits: PlanLimits;
  usage: { applications: number; resumes: number };
  plans: { id: PlanId; name: string; pricePaise: number; periodDays: number; limits: PlanLimits }[];
  payments: { enabled: boolean; testMode: true; keyId: string | null };
}

export interface CheckoutOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  planName: string;
}

export interface PaymentResponse {
  id: string;
  plan: PlanId;
  amount: number;
  currency: string;
  status: 'created' | 'paid' | 'failed';
  orderId: string;
  paymentId: string | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
