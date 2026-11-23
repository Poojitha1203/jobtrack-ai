import { Link } from 'react-router';
import { CalendarDays } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card.tsx';
import { EmptyState } from '../ui/EmptyState.tsx';
import { Skeleton } from '../ui/Skeleton.tsx';
import { formatRelativeDay, formatTime } from '../../lib/date.ts';
import { INTERVIEW_TYPE_META } from '../../lib/interviewOptions.ts';
import type { Interview } from '../../types/interview.ts';

const monthFormat = new Intl.DateTimeFormat('en-US', { month: 'short' });

export function UpcomingInterviews({ interviews }: { interviews: Interview[] | undefined }) {
  return (
    <Card>
      <CardHeader
        title="Upcoming interviews"
        action={
          <Link to="/interviews" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            View all
          </Link>
        }
      />

      {!interviews && (
        <div className="space-y-3 p-5" role="status" aria-label="Loading interviews">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {interviews?.length === 0 && (
        <EmptyState icon={CalendarDays} title="Nothing scheduled" description="Interviews you schedule will appear here." />
      )}

      {interviews && interviews.length > 0 && (
        <ul className="space-y-3 p-5">
          {interviews.map((interview) => {
            const date = new Date(interview.scheduledAt);
            const TypeIcon = INTERVIEW_TYPE_META[interview.interviewType].icon;
            return (
              <li key={interview.id} className="flex gap-3 rounded-lg border border-slate-100 p-3">
                <div className="flex w-12 shrink-0 flex-col items-center justify-center rounded-md bg-brand-50 py-1.5 text-brand-700">
                  <span className="text-[11px] font-medium uppercase">{monthFormat.format(date)}</span>
                  <span className="text-lg leading-none font-semibold">{date.getDate()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/applications/${interview.application.id}`}
                    className="block truncate text-sm font-medium text-slate-900 hover:text-brand-700"
                  >
                    {interview.application.company.name}
                  </Link>
                  <p className="truncate text-xs text-slate-500">
                    {interview.application.jobTitle} · {interview.round}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                    <TypeIcon className="size-3.5 text-slate-400" aria-hidden="true" />
                    {formatRelativeDay(date)} at {formatTime(date)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
