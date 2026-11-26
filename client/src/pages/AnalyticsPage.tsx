import { useState } from 'react';
import { Link } from 'react-router';
import { ChartColumn } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader.tsx';
import { Card, CardHeader } from '../components/ui/Card.tsx';
import { Alert } from '../components/ui/Alert.tsx';
import { EmptyState } from '../components/ui/EmptyState.tsx';
import { Skeleton } from '../components/ui/Skeleton.tsx';
import { buttonClasses } from '../lib/buttonStyles.ts';
import { ChartCard, DataTable } from '../components/analytics/ChartCard.tsx';
import { ActivityChart, FUNNEL_COLORS, HorizontalBarChart, ResponseRateChart } from '../components/analytics/Charts.tsx';
import { useAsyncData } from '../hooks/useAsyncData.ts';
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts';
import { usePlan } from '../hooks/usePlan.ts';
import { UpgradeBanner } from '../components/billing/UpgradeBanner.tsx';
import { Lock } from 'lucide-react';
import { getAnalytics } from '../services/analytics.ts';
import { STATUS_META } from '../lib/status.ts';
import { cn } from '../lib/cn.ts';
import type { AnalyticsRange } from '../types/analytics.ts';

const RANGES: { value: AnalyticsRange; label: string }[] = [
  { value: 3, label: '3 months' },
  { value: 6, label: '6 months' },
  { value: 12, label: '12 months' },
  { value: 0, label: 'All time' },
];

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
    </Card>
  );
}

export function AnalyticsPage() {
  useDocumentTitle('Analytics');
  const { billing } = usePlan();
  const maxMonths = billing?.limits.analyticsMonths ?? null;
  const isLocked = (value: AnalyticsRange) => maxMonths !== null && (value === 0 || value > maxMonths);
  const [range, setRange] = useState<AnalyticsRange>(6);
  const { data, error, loading, reload } = useAsyncData(() => getAnalytics(range), `analytics:${range}`);

  const filters = (
    <div role="group" aria-label="Time range" className="inline-flex rounded-lg bg-slate-100 p-1">
      {RANGES.map((r) => (
        <button
          key={r.value}
          type="button"
          aria-pressed={range === r.value}
          onClick={() => setRange(r.value)}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition',
            range === r.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
          )}
        >
          {r.label}
          {isLocked(r.value) && <Lock className="ml-1 inline size-3 opacity-60" aria-label="Pro" />}
        </button>
      ))}
    </div>
  );

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" actions={filters} />
        <Alert tone="error" title="Couldn't load analytics">
          {error.message}{' '}
          <button type="button" onClick={reload} className="font-medium underline">Try again</button>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" actions={filters} />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" role="status" aria-label="Loading analytics">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const { summary } = data;
  const shownMonths = data.planLimited ? data.planLimited.maxMonths : range;
  const rangeText = shownMonths === 0 ? 'all time' : `the last ${shownMonths} months`;

  if (summary.total === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" description="Trends across your job search." actions={filters} />
        <Card>
          <EmptyState
            icon={ChartColumn}
            title={`No applications in ${rangeText}`}
            description="Add applications (and keep their status up to date) to see your trends, rates and best job sources."
            action={<Link to="/applications?new=1" className={buttonClasses()}>Add application</Link>}
            className="py-16"
          />
        </Card>
      </div>
    );
  }

  const funnel = data.funnel.map((s) => ({ ...s, share: summary.submitted ? Math.round((s.count / summary.submitted) * 100) : 0 }));
  const statusRows = data.byStatus.map((s) => ({ ...s, name: STATUS_META[s.status].label }));
  const hasMonthlyResponses = data.byMonth.some((m) => m.responseRate !== null);

  return (
    <div className={cn('space-y-6 transition-opacity', loading && 'opacity-60')}>
      <PageHeader title="Analytics" description={`Trends across your job search for ${rangeText}.`} actions={filters} />

      {data.planLimited && (
        <UpgradeBanner>
          The Free plan shows the last {data.planLimited.maxMonths} months. Upgrade to Pro for 6-month, 12-month and all-time analytics.
        </UpgradeBanner>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Applications sent" value={summary.submitted.toLocaleString()} hint={`${summary.total} tracked incl. wishlist`} />
        <Kpi label="Response rate" value={`${summary.responseRate}%`} hint={`${summary.responded} got a reply`} />
        <Kpi label="Interview rate" value={`${summary.interviewRate}%`} hint={`${summary.interviewed} reached interviews`} />
        <Kpi label="Success rate" value={`${summary.successRate}%`} hint={`${summary.offers} offer${summary.offers === 1 ? '' : 's'} · ${summary.interviewToOfferRate}% of interviews`} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <ChartCard
          title="Applications by month"
          description="Applications sent and interviews held each month"
          table={<DataTable columns={['Month', 'Applications', 'Interviews']} rows={data.byMonth.map((m) => [m.label, m.applications, m.interviews])} />}
        >
          <ActivityChart data={data.byMonth} />
        </ChartCard>

        <ChartCard
          title="Response rate over time"
          description="Share of each month's applications that got any reply"
          empty={!hasMonthlyResponses && 'No applications with an applied date in this range yet.'}
          table={
            <DataTable
              columns={['Month', 'Response rate']}
              rows={data.byMonth.map((m) => [m.label, m.responseRate === null ? '—' : `${m.responseRate}%`])}
            />
          }
        >
          <ResponseRateChart data={data.byMonth} />
        </ChartCard>

        <ChartCard
          title="Application success funnel"
          description="How far your applications get"
          empty={summary.submitted === 0 && 'Only wishlist items so far — apply to a job to start the funnel.'}
          table={<DataTable columns={['Stage', 'Applications', '% of applied']} rows={funnel.map((s) => [s.stage, s.count, `${s.share}%`])} />}
        >
          <HorizontalBarChart
            data={funnel}
            nameKey="stage"
            valueKey="count"
            valueName="Applications"
            colors={FUNNEL_COLORS}
            label={(s) => `${s.count} (${s.share}%)`}
          />
        </ChartCard>

        <ChartCard
          title="Applications by status"
          description="Where every tracked application is right now"
          table={<DataTable columns={['Status', 'Applications']} rows={statusRows.map((s) => [s.name, s.count])} />}
        >
          <HorizontalBarChart data={statusRows} nameKey="name" valueKey="count" valueName="Applications" />
        </ChartCard>

        <ChartCard
          title="Interviews by company"
          description="Top companies by number of interviews"
          empty={data.interviewsByCompany.length === 0 && 'No interviews scheduled in this range.'}
          table={
            <DataTable
              columns={['Company', 'Interviews', 'Passed']}
              rows={data.interviewsByCompany.map((c) => [c.company, c.interviews, c.passed])}
            />
          }
        >
          <HorizontalBarChart data={data.interviewsByCompany} nameKey="company" valueKey="interviews" valueName="Interviews" />
        </ChartCard>

        <ChartCard
          title="Most requested skills"
          description={`Share of your ${data.jobsWithDescriptions} saved job descriptions that mention each skill`}
          empty={data.topSkills.length === 0 && 'Paste job descriptions into your applications to see which skills come up most.'}
          table={<DataTable columns={['Skill', 'Jobs', '% of jobs']} rows={data.topSkills.map((s) => [s.skill, s.jobs, `${s.percent}%`])} />}
        >
          <HorizontalBarChart
            data={data.topSkills}
            nameKey="skill"
            valueKey="percent"
            valueName="Share of jobs"
            formatValue={(v) => `${v}%`}
            label={(s) => `${s.percent}% (${s.jobs})`}
          />
        </ChartCard>
      </div>

      <Card className="overflow-hidden">
        <CardHeader title="Job source effectiveness" description="Which places to apply actually lead to replies, interviews and offers" />
        {data.sources.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No sent applications in this range.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="mt-4 w-full min-w-[36rem] text-left text-sm">
              <thead className="border-y border-slate-100 bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-2.5 font-medium">Source</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">Applications</th>
                  <th scope="col" className="w-1/3 px-5 py-2.5 font-medium">Response rate</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">Interviews</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">Offers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.sources.map((s) => (
                  <tr key={s.source}>
                    <td className={cn('px-5 py-3 font-medium', s.source === 'Not recorded' ? 'text-slate-400' : 'text-slate-900')}>{s.source}</td>
                    <td className="px-5 py-3 text-right text-slate-700 tabular-nums">{s.applications}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                          <div className="h-full rounded-full bg-[#2a78d6]" style={{ width: `${s.responseRate}%` }} />
                        </div>
                        <span className="w-10 text-right text-slate-700 tabular-nums">{s.responseRate}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-700 tabular-nums">{s.interviews} <span className="text-slate-400">({s.interviewRate}%)</span></td>
                    <td className="px-5 py-3 text-right text-slate-700 tabular-nums">{s.offers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          Tip: fill in the <strong>Source</strong> field on your applications to make this table more useful.
        </p>
      </Card>
    </div>
  );
}
