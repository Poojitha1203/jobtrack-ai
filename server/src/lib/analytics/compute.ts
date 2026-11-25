import { APPLICATION_STATUSES, type ApplicationStatus } from '../../constants/application.js';
import type { InterviewResult } from '../../constants/interview.js';
import { detectJobSkills } from '../matching/analyzer.js';
import type { CompiledSkill } from '../matching/text.js';

export interface AnalyticsApplication {
  status: ApplicationStatus;
  /** YYYY-MM-DD */
  appliedAt: string | null;
  createdAt: string;
  source: string | null;
  companyName: string;
  jobDescription: string | null;
}

export interface AnalyticsInterview {
  companyName: string;
  scheduledAt: string;
  result: InterviewResult;
}

export interface AnalyticsInput {
  applications: AnalyticsApplication[];
  interviews: AnalyticsInterview[];
  catalog: CompiledSkill[];

  months: number;
  today?: Date;
}

const RESPONDED: ApplicationStatus[] = ['assessment', 'interview', 'offer', 'rejected'];
const INTERVIEWED: ApplicationStatus[] = ['interview', 'offer'];
const MAX_MONTHS_SHOWN = 24;

const pct = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 100));
const monthKey = (date: string) => date.slice(0, 7);
const pad = (n: number) => String(n).padStart(2, '0');
const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit' });


const activityDate = (app: AnalyticsApplication) => app.appliedAt ?? app.createdAt.slice(0, 10);

function monthRange(fromKey: string, toKeyValue: string): string[] {
  const keys: string[] = [];
  const [fy, fm] = fromKey.split('-').map(Number) as [number, number];
  const cursor = new Date(fy, fm - 1, 1);
  while (toKey(cursor) <= toKeyValue && keys.length < MAX_MONTHS_SHOWN * 2) {
    keys.push(toKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return keys.slice(-MAX_MONTHS_SHOWN);
}

export function computeAnalytics({ applications, interviews, catalog, months, today = new Date() }: AnalyticsInput) {
  const currentKey = toKey(today);
  const startKey = months > 0 ? toKey(new Date(today.getFullYear(), today.getMonth() - (months - 1), 1)) : null;

  const apps = startKey ? applications.filter((a) => monthKey(activityDate(a)) >= startKey) : applications;
  const ivs = startKey ? interviews.filter((i) => monthKey(i.scheduledAt) >= startKey) : interviews;

  const submittedApps = apps.filter((a) => a.status !== 'wishlist');
  const submitted = submittedApps.length;
  const responded = apps.filter((a) => RESPONDED.includes(a.status)).length;
  const interviewed = apps.filter((a) => INTERVIEWED.includes(a.status)).length;
  const offers = apps.filter((a) => a.status === 'offer').length;
  const rejected = apps.filter((a) => a.status === 'rejected').length;

  const summary = {
    total: apps.length,
    submitted,
    responded,
    interviewed,
    offers,
    rejected,
    interviewsScheduled: ivs.length,
    responseRate: pct(responded, submitted),
    interviewRate: pct(interviewed, submitted),
    successRate: pct(offers, submitted),
    interviewToOfferRate: pct(offers, interviewed),
  };

  // Months on the x-axis: the selected range, or from the earliest record for "all time".
  const earliest = [...apps.map((a) => monthKey(activityDate(a))), ...ivs.map((i) => monthKey(i.scheduledAt))].sort()[0];
  const fromKey = startKey ?? (earliest && earliest < currentKey ? earliest : currentKey);
  const byMonth = monthRange(fromKey, currentKey).map((key) => {
    const appliedThisMonth = submittedApps.filter((a) => a.appliedAt && monthKey(a.appliedAt) === key);
    const [y, m] = key.split('-').map(Number) as [number, number];
    return {
      month: key,
      label: monthLabel.format(new Date(y, m - 1, 1)),
      applications: appliedThisMonth.length,
      interviews: ivs.filter((i) => monthKey(i.scheduledAt) === key).length,
      // null (not 0) when nothing was sent that month, so the line shows a gap instead of a false drop.
      responseRate: appliedThisMonth.length
        ? pct(appliedThisMonth.filter((a) => RESPONDED.includes(a.status)).length, appliedThisMonth.length)
        : null,
    };
  });

  const byStatus = APPLICATION_STATUSES.map((status) => ({ status, count: apps.filter((a) => a.status === status).length }));

  const funnel = [
    { stage: 'Applied', count: submitted },
    { stage: 'Got a response', count: responded },
    { stage: 'Interviewed', count: interviewed },
    { stage: 'Offer', count: offers },
  ];

  const companyCounts = new Map<string, { company: string; interviews: number; passed: number }>();
  for (const iv of ivs) {
    const entry = companyCounts.get(iv.companyName) ?? { company: iv.companyName, interviews: 0, passed: 0 };
    entry.interviews += 1;
    if (iv.result === 'passed') entry.passed += 1;
    companyCounts.set(iv.companyName, entry);
  }
  const interviewsByCompany = [...companyCounts.values()]
    .sort((a, b) => b.interviews - a.interviews || a.company.localeCompare(b.company))
    .slice(0, 8);

  const described = apps.filter((a) => a.jobDescription?.trim());
  const skillCounts = new Map<string, number>();
  for (const app of described) {
    for (const { skill } of detectJobSkills(app.jobDescription!, catalog)) {
      skillCounts.set(skill.name, (skillCounts.get(skill.name) ?? 0) + 1);
    }
  }
  const topSkills = [...skillCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([skill, jobs]) => ({ skill, jobs, percent: pct(jobs, described.length) }));

  const sourceGroups = new Map<string, { source: string; apps: AnalyticsApplication[] }>();
  for (const app of submittedApps) {
    const name = app.source?.trim() || 'Not recorded';
    const key = name.toLowerCase();
    const group = sourceGroups.get(key) ?? { source: name, apps: [] };
    group.apps.push(app);
    sourceGroups.set(key, group);
  }
  const sources = [...sourceGroups.values()]
    .map(({ source, apps: list }) => {
      const responses = list.filter((a) => RESPONDED.includes(a.status)).length;
      const interviewsCount = list.filter((a) => INTERVIEWED.includes(a.status)).length;
      return {
        source,
        applications: list.length,
        responses,
        interviews: interviewsCount,
        offers: list.filter((a) => a.status === 'offer').length,
        responseRate: pct(responses, list.length),
        interviewRate: pct(interviewsCount, list.length),
      };
    })
    .sort((a, b) => b.applications - a.applications || a.source.localeCompare(b.source))
    .slice(0, 10);

  return {
    range: { months, from: startKey, to: currentKey },
    summary,
    byMonth,
    byStatus,
    funnel,
    interviewsByCompany,
    topSkills,
    jobsWithDescriptions: described.length,
    sources,
  };
}

export type AnalyticsResult = ReturnType<typeof computeAnalytics>;
