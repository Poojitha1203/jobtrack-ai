import { Link } from 'react-router';
import { BriefcaseBusiness, Info, MessagesSquare, Plus, Send, Trophy } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader.tsx';
import { StatCard } from '../components/dashboard/StatCard.tsx';
import { ActivityChart } from '../components/dashboard/ActivityChart.tsx';
import { WeeklyGoal } from '../components/dashboard/WeeklyGoal.tsx';
import { PipelineCard } from '../components/dashboard/PipelineCard.tsx';
import { RecentApplications } from '../components/dashboard/RecentApplications.tsx';
import { UpcomingInterviews } from '../components/dashboard/UpcomingInterviews.tsx';
import { buttonClasses } from '../lib/buttonStyles.ts';
import { appliedThisWeek, computeMetrics, weeklyActivity } from '../lib/metrics.ts';
import { formatLongDate, greeting } from '../lib/date.ts';
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts';
import { SAMPLE_WEEKLY_GOAL, sampleApplications, sampleInterviews } from '../data/sampleData.ts';

export function DashboardPage() {
  useDocumentTitle('Dashboard');

  // Phase 4 swaps these sample arrays for data loaded from the API.
  const applications = sampleApplications;
  const now = new Date();

  const metrics = computeMetrics(applications);
  const weeks = weeklyActivity(applications, 8, now);
  const sentThisWeek = appliedThisWeek(applications, now);

  const recent = applications
    .filter((a) => a.appliedAt)
    .sort((a, b) => (b.appliedAt ?? '').localeCompare(a.appliedAt ?? ''))
    .slice(0, 5);

  const upcoming = sampleInterviews
    .filter((i) => new Date(i.scheduledAt) >= now)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting(now)} 👋`}
        description={`${formatLongDate(now)} · Here's how your job search is going.`}
        actions={
          <Link to="/applications" className={buttonClasses()}>
            <Plus className="size-4" aria-hidden="true" /> Add application
          </Link>
        }
      />

      <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        You're viewing sample data. Your real applications will appear here once accounts and the
        database are connected.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total applications"
          value={metrics.total}
          hint={`${metrics.submitted} sent · ${metrics.byStatus.wishlist} on wishlist`}
          icon={BriefcaseBusiness}
        />
        <StatCard
          label="Interviews"
          value={metrics.byStatus.interview}
          hint={`${upcoming.length} scheduled ahead`}
          icon={MessagesSquare}
          accent="violet"
        />
        <StatCard
          label="Offers"
          value={metrics.byStatus.offer}
          hint={`${metrics.byStatus.rejected} rejections so far`}
          icon={Trophy}
          accent="emerald"
        />
        <StatCard
          label="Response rate"
          value={`${metrics.responseRate}%`}
          hint={`${metrics.byStatus.applied} still waiting to hear back`}
          icon={Send}
          accent="sky"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityChart weeks={weeks} />
        </div>
        <WeeklyGoal sent={sentThisWeek} goal={SAMPLE_WEEKLY_GOAL} />
      </div>

      <PipelineCard metrics={metrics} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentApplications applications={recent} />
        </div>
        <UpcomingInterviews interviews={upcoming} />
      </div>
    </div>
  );
}
