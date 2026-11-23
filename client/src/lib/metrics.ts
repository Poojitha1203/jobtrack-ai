import { APPLICATION_STATUSES, type Application, type ApplicationStatus } from '../types/application.ts';
import { addDays, startOfWeek } from './date.ts';
import { parseDateOnly } from './format.ts';

type MetricInput = Pick<Application, 'status' | 'appliedAt'>;

export const percent = (part: number, whole: number) =>
  whole === 0 ? 0 : Math.round((part / whole) * 100);

const RESPONDED: ApplicationStatus[] = ['assessment', 'interview', 'offer', 'rejected'];
const INTERVIEWED: ApplicationStatus[] = ['interview', 'offer'];

export interface DashboardMetrics {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  /** Everything except wishlist items. */
  submitted: number;
  responseRate: number;
  interviewRate: number;
  /** % of interviewed applications that became offers. */
  interviewConversion: number;
}

export function computeMetrics(applications: MetricInput[]): DashboardMetrics {
  const byStatus = Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, 0])) as Record<
    ApplicationStatus,
    number
  >;
  for (const app of applications) byStatus[app.status] += 1;

  const submitted = applications.length - byStatus.wishlist;
  const responded = RESPONDED.reduce((sum, s) => sum + byStatus[s], 0);
  const interviewed = INTERVIEWED.reduce((sum, s) => sum + byStatus[s], 0);

  return {
    total: applications.length,
    byStatus,
    submitted,
    responseRate: percent(responded, submitted),
    interviewRate: percent(interviewed, submitted),
    interviewConversion: percent(byStatus.offer, interviewed),
  };
}

export interface WeekBucket {
  weekStart: Date;
  count: number;
}

export function weeklyActivity(
  applications: MetricInput[],
  weeks = 8,
  today: Date = new Date(),
): WeekBucket[] {
  const currentWeek = startOfWeek(today);
  const buckets: WeekBucket[] = Array.from({ length: weeks }, (_, i) => ({
    weekStart: addDays(currentWeek, -7 * (weeks - 1 - i)),
    count: 0,
  }));

  for (const app of applications) {
    if (!app.appliedAt) continue;
    const week = startOfWeek(parseDateOnly(app.appliedAt)).getTime();
    const bucket = buckets.find((b) => b.weekStart.getTime() === week);
    if (bucket) bucket.count += 1;
  }
  return buckets;
}

export function appliedThisWeek(applications: MetricInput[], today: Date = new Date()): number {
  const weekStart = startOfWeek(today).getTime();
  return applications.filter((a) => a.appliedAt && parseDateOnly(a.appliedAt).getTime() >= weekStart)
    .length;
}
