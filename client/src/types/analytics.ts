import type { ApplicationStatus } from './application.ts';

export type AnalyticsRange = 3 | 6 | 12 | 0;

export interface AnalyticsReport {
  range: { months: number; from: string | null; to: string };
  summary: {
    total: number;
    submitted: number;
    responded: number;
    interviewed: number;
    offers: number;
    rejected: number;
    interviewsScheduled: number;
    responseRate: number;
    interviewRate: number;
    successRate: number;
    interviewToOfferRate: number;
  };
  byMonth: { month: string; label: string; applications: number; interviews: number; responseRate: number | null }[];
  byStatus: { status: ApplicationStatus; count: number }[];
  funnel: { stage: string; count: number }[];
  interviewsByCompany: { company: string; interviews: number; passed: number }[];
  topSkills: { skill: string; jobs: number; percent: number }[];
  jobsWithDescriptions: number;
  sources: {
    source: string;
    applications: number;
    responses: number;
    interviews: number;
    offers: number;
    responseRate: number;
    interviewRate: number;
  }[];
}
