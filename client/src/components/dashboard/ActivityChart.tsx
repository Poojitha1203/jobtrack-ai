import { Card, CardHeader } from '../ui/Card.tsx';
import { formatShortDate } from '../../lib/date.ts';
import type { WeekBucket } from '../../lib/metrics.ts';
import { cn } from '../../lib/cn.ts';

// A lightweight bar chart built with plain divs. Richer charts (Recharts)
// arrive with the Analytics page in Phase 9.
export function ActivityChart({ weeks }: { weeks: WeekBucket[] }) {
  const max = Math.max(1, ...weeks.map((w) => w.count));
  const total = weeks.reduce((sum, w) => sum + w.count, 0);
  const summary = weeks
    .map((w) => `week of ${formatShortDate(w.weekStart)}: ${w.count}`)
    .join(', ');

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Application activity"
        description={`${total} applications sent in the last ${weeks.length} weeks`}
      />
      <div
        className="flex flex-1 items-end gap-2 px-5 pt-6 pb-5 sm:gap-3"
        role="img"
        aria-label={`Applications per week: ${summary}`}
      >
        {weeks.map((week, index) => {
          const isCurrent = index === weeks.length - 1;
          return (
            <div key={week.weekStart.toISOString()} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <span className="text-xs font-medium text-slate-600 tabular-nums">{week.count}</span>
              <div className="flex h-40 w-full items-end">
                <div
                  className={cn(
                    'w-full rounded-t-md transition-all',
                    isCurrent ? 'bg-brand-600' : 'bg-brand-200',
                  )}
                  // At least 4% tall so empty weeks still show a sliver.
                  style={{ height: `${Math.max(4, (week.count / max) * 100)}%` }}
                />
              </div>
              <span className="w-full truncate text-center text-[11px] text-slate-400">
                {isCurrent ? 'This wk' : formatShortDate(week.weekStart)}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
