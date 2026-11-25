import type { SupabaseClient } from '@supabase/supabase-js';
import type { ApplicationStatus } from '../constants/application.js';
import type { InterviewResult } from '../constants/interview.js';
import { computeAnalytics, type AnalyticsResult } from '../lib/analytics/compute.js';
import { getSkillCatalog } from './skillCatalog.service.js';

const MAX_ROWS = 2000;

interface ApplicationRow {
  status: ApplicationStatus;
  applied_at: string | null;
  created_at: string;
  source: string | null;
  job_description: string | null;
  company: { name: string } | null;
}

interface InterviewRow {
  scheduled_at: string;
  result: InterviewResult;
  application: { company: { name: string } | null } | null;
}

export async function getAnalytics(supabase: SupabaseClient, months: number): Promise<AnalyticsResult> {
  const [applications, interviews, catalog] = await Promise.all([
    supabase
      .from('applications')
      .select('status, applied_at, created_at, source, job_description, company:companies(name)')
      .limit(MAX_ROWS)
      .returns<ApplicationRow[]>(),
    supabase
      .from('interviews')
      .select('scheduled_at, result, application:applications(company:companies(name))')
      .limit(MAX_ROWS)
      .returns<InterviewRow[]>(),
    getSkillCatalog(supabase),
  ]);
  if (applications.error) throw new Error(`Failed to load applications: ${applications.error.message}`);
  if (interviews.error) throw new Error(`Failed to load interviews: ${interviews.error.message}`);

  return computeAnalytics({
    months,
    catalog,
    applications: applications.data.map((a) => ({
      status: a.status,
      appliedAt: a.applied_at,
      createdAt: a.created_at,
      source: a.source,
      companyName: a.company?.name ?? 'Unknown',
      jobDescription: a.job_description,
    })),
    interviews: interviews.data.map((i) => ({
      scheduledAt: i.scheduled_at,
      result: i.result,
      companyName: i.application?.company?.name ?? 'Unknown',
    })),
  });
}
