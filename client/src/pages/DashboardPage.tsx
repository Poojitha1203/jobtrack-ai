import { useState } from 'react';
import { Link } from 'react-router';
import { BellRing, BriefcaseBusiness, MessagesSquare, Plus, Rocket, Send, Trophy } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader.tsx';
import { StatCard } from '../components/dashboard/StatCard.tsx';
import { ActivityChart } from '../components/dashboard/ActivityChart.tsx';
import { WeeklyGoal } from '../components/dashboard/WeeklyGoal.tsx';
import { PipelineCard } from '../components/dashboard/PipelineCard.tsx';
import { RecentApplications } from '../components/dashboard/RecentApplications.tsx';
import { UpcomingInterviews } from '../components/dashboard/UpcomingInterviews.tsx';
import { Card } from '../components/ui/Card.tsx';
import { Alert } from '../components/ui/Alert.tsx';
import { EmptyState } from '../components/ui/EmptyState.tsx';
import { Skeleton } from '../components/ui/Skeleton.tsx';
import { buttonClasses } from '../lib/buttonStyles.ts';
import { appliedThisWeek, computeMetrics, weeklyActivity } from '../lib/metrics.ts';
import { formatLongDate, greeting } from '../lib/date.ts';
import { getDisplayName } from '../lib/user.ts';
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts';
import { useAuth } from '../hooks/useAuth.ts';
import { useAsyncData } from '../hooks/useAsyncData.ts';
import { listAllApplications } from '../services/applications.ts';
import { listInterviews } from '../services/interviews.ts';
import { listReminders } from '../services/reminders.ts';

const DEFAULT_WEEKLY_GOAL = 5;

function DashboardSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading dashboard">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}

export function DashboardPage() {
  useDocumentTitle('Dashboard');
  const { profile, user } = useAuth();
  const { data: applications, error, reload } = useAsyncData(listAllApplications, 'dashboard-applications');
  const [upcomingFrom] = useState(() => new Date().toISOString());
  const upcoming = useAsyncData(() => listInterviews({ from: upcomingFrom, order: 'asc', limit: 4 }), 'dashboard-interviews');
  const dueReminders = useAsyncData(
    () => listReminders({ status: 'open', to: new Date().toISOString(), limit: 50 }),
    'dashboard-due-reminders',
  );
  const dueCount = dueReminders.data?.length ?? 0;

  const firstName = getDisplayName(profile, user).split(/[\s@]/)[0];
  const weeklyGoal = profile?.weeklyGoal ?? DEFAULT_WEEKLY_GOAL;
  const now = new Date();

  const dueBanner = dueCount > 0 && (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center">
      <BellRing className="size-5 shrink-0 text-amber-600" aria-hidden="true" />
      <p className="flex-1 text-sm text-amber-900">
        You have <strong>{dueCount}</strong> reminder{dueCount === 1 ? '' : 's'} due
        {dueReminders.data?.[0] && <> — next up: “{dueReminders.data[0].title}”</>}.
      </p>
      <Link to="/reminders" className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
        View reminders
      </Link>
    </div>
  );

  const header = (
    <PageHeader
      title={`${greeting(now)}, ${firstName} 👋`}
      description={`${formatLongDate(now)} · Here's how your job search is going.`}
      actions={
        <Link to="/applications?new=1" className={buttonClasses()}>
          <Plus className="size-4" aria-hidden="true" /> Add application
        </Link>
      }
    />
  );

  if (error) {
    return (
      <div className="space-y-6">
        {header}
        <Alert tone="error" title="Couldn't load your dashboard">
          {error.message}{' '}
          <button type="button" onClick={reload} className="font-medium underline">Try again</button>
        </Alert>
      </div>
    );
  }

  if (!applications) {
    return (
      <div className="space-y-6">
        {header}
        <DashboardSkeleton />
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="space-y-6">
        {header}
        <Card>
          <EmptyState
            icon={Rocket}
            title="Let's start your job search"
            description="Add the jobs you've applied to (or want to apply to) and your stats, charts and weekly progress will appear here."
            action={
              <Link to="/applications?new=1" className={buttonClasses()}>
                <Plus className="size-4" aria-hidden="true" /> Add your first application
              </Link>
            }
            className="py-16"
          />
        </Card>
      </div>
    );
  }

  const metrics = computeMetrics(applications);
  const weeks = weeklyActivity(applications, 8, now);
  const sentThisWeek = appliedThisWeek(applications, now);
  const recent = [...applications]
    .sort((a, b) => (b.appliedAt ?? b.createdAt).localeCompare(a.appliedAt ?? a.createdAt))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {header}
      {dueBanner}

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
          hint={upcoming.data ? `${upcoming.data.length}${upcoming.data.length === 4 ? '+' : ''} scheduled ahead` : 'Applications at the interview stage'}
          icon={MessagesSquare}
          accent="violet"
        />
        <StatCard
          label="Offers"
          value={metrics.byStatus.offer}
          hint={`${metrics.byStatus.rejected} rejection${metrics.byStatus.rejected === 1 ? '' : 's'} so far`}
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
        <WeeklyGoal sent={sentThisWeek} goal={weeklyGoal} />
      </div>

      <PipelineCard metrics={metrics} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentApplications applications={recent} />
        </div>
        <UpcomingInterviews interviews={upcoming.error ? [] : upcoming.data} />
      </div>
    </div>
  );
}
