import { Link } from 'react-router';
import { Building2, CalendarDays, Phone, Video, type LucideIcon } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card.tsx';
import { EmptyState } from '../ui/EmptyState.tsx';
import { formatRelativeDay, formatTime } from '../../lib/date.ts';
import type { Interview, InterviewType } from '../../types/interview.ts';

const TYPE_ICON: Record<InterviewType, LucideIcon> = {
  phone: Phone,
  video: Video,
  onsite: Building2,
};

const monthFormat = new Intl.DateTimeFormat('en-US', { month: 'short' });

export function UpcomingInterviews({ interviews }: { interviews: Interview[] }) {
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

      {interviews.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nothing scheduled"
          description="Interviews you schedule will appear here."
        />
      ) : (
        <ul className="space-y-3 p-5">
          {interviews.map((interview) => {
            const date = new Date(interview.scheduledAt);
            const TypeIcon = TYPE_ICON[interview.type];
            return (
              <li key={interview.id} className="flex gap-3 rounded-lg border border-slate-100 p-3">
                {/* Calendar-style date block */}
                <div className="flex w-12 shrink-0 flex-col items-center justify-center rounded-md bg-brand-50 py-1.5 text-brand-700">
                  <span className="text-[11px] font-medium uppercase">{monthFormat.format(date)}</span>
                  <span className="text-lg leading-none font-semibold">{date.getDate()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{interview.company}</p>
                  <p className="truncate text-xs text-slate-500">
                    {interview.jobTitle} · {interview.round}
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
