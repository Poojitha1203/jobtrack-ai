import { APPLICATION_STATUSES, type Application, type ApplicationStatus } from '../types/application.ts';
import { addDays, startOfWeek } from './date.ts';

// Pure functions that turn a list of applications into dashboard numbers.
// They don't care where the data comes from: sample data now, the database in Phase 4.

export const percent = (part: number, whole: number) =>
  whole === 0 ? 0 : Math.round((part / whole) * 100);

const RESPONDED: ApplicationStatus[] = ['assessment', 'interview', 'offer', 'rejected'];
const INTERVIEWED: ApplicationStatus[] = ['interview', 'offer'];

export interface DashboardMetrics {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  /** Everything except wishlist items, i.e. applications actually sent. */
  submitted: number;
  /** % of submitted applications that got any reply (assessment, interview, offer, or rejection). */
  responseRate: number;
  /** % of submitted applications that reached the interview stage. */
  interviewRate: number;
  /** % of interviewed applications that turned into an offer. */
  interviewConversion: number;
}

export function computeMetrics(applications: Application[]): DashboardMetrics {
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

/** Number of applications sent per week for the last `weeks` weeks (oldest first). */
export function weeklyActivity(
  applications: Application[],
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
    const week = startOfWeek(new Date(app.appliedAt)).getTime();
    const bucket = buckets.find((b) => b.weekStart.getTime() === week);
    if (bucket) bucket.count += 1;
  }
  return buckets;
}

/** Applications sent since Monday of the current week. */
export function appliedThisWeek(applications: Application[], today: Date = new Date()): number {
  const weekStart = startOfWeek(today).getTime();
  return applications.filter((a) => a.appliedAt && new Date(a.appliedAt).getTime() >= weekStart)
    .length;
}
