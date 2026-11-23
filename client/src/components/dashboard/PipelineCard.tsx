import { Card, CardHeader } from '../ui/Card.tsx';
import { STATUS_META } from '../../lib/status.ts';
import { percent, type DashboardMetrics } from '../../lib/metrics.ts';
import { APPLICATION_STATUSES } from '../../types/application.ts';
import { cn } from '../../lib/cn.ts';

// Shows how applications are spread across stages as one segmented bar,
// plus the three conversion rates underneath.
export function PipelineCard({ metrics }: { metrics: DashboardMetrics }) {
  const rates = [
    { label: 'Response rate', value: metrics.responseRate, hint: 'Applications that got any reply' },
    { label: 'Interview rate', value: metrics.interviewRate, hint: 'Applications that reached interviews' },
    { label: 'Interview → offer', value: metrics.interviewConversion, hint: 'Interviews that became offers' },
  ];

  return (
    <Card>
      <CardHeader title="Pipeline" description={`${metrics.total} applications by current stage`} />
      <div className="px-5 pt-5 pb-5">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
          {APPLICATION_STATUSES.map((status) =>
            metrics.byStatus[status] > 0 ? (
              <div
                key={status}
                className={STATUS_META[status].barClass}
                style={{ width: `${percent(metrics.byStatus[status], metrics.total)}%` }}
                title={`${STATUS_META[status].label}: ${metrics.byStatus[status]}`}
              />
            ) : null,
          )}
        </div>

        <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
          {APPLICATION_STATUSES.map((status) => (
            <li key={status} className="flex items-center gap-2">
              <span className={cn('size-2.5 shrink-0 rounded-full', STATUS_META[status].barClass)} aria-hidden="true" />
              <span className="text-sm text-slate-600">{STATUS_META[status].label}</span>
              <span className="text-sm font-semibold text-slate-900 tabular-nums">
                {metrics.byStatus[status]}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-5 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-3">
          {rates.map((rate) => (
            <div key={rate.label} className="rounded-lg bg-slate-50 px-4 py-3">
              <dt className="text-xs font-medium text-slate-500">{rate.label}</dt>
              <dd className="mt-1 text-xl font-semibold text-slate-900 tabular-nums">{rate.value}%</dd>
              <dd className="text-xs text-slate-400">{rate.hint}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Card>
  );
}
