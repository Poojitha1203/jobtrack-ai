import { useState } from 'react';
import { Link } from 'react-router';
import { Pencil, Trash2, Video } from 'lucide-react';
import { Badge } from '../ui/Badge.tsx';
import { buttonClasses } from '../../lib/buttonStyles.ts';
import { formatLongDate, formatRelativeDay, formatTime } from '../../lib/date.ts';
import { toDateOnly } from '../../lib/format.ts';
import { INTERVIEW_RESULT_META, INTERVIEW_TYPE_META } from '../../lib/interviewOptions.ts';
import { interviewEndTime } from '../../lib/interviewForm.ts';
import type { Interview } from '../../types/interview.ts';

interface InterviewListProps {
  interviews: Interview[];
  onEdit: (interview: Interview) => void;
  onDelete: (interview: Interview) => void;
  /** Hide the job/company line (e.g. on an application's own page). */
  hideApplication?: boolean;
  /** Hide the per-day headings (e.g. when the surrounding card already shows the date). */
  hideDayHeadings?: boolean;
}

function groupByDay(interviews: Interview[]) {
  const groups = new Map<string, Interview[]>();
  for (const interview of interviews) {
    const key = toDateOnly(new Date(interview.scheduledAt));
    groups.set(key, [...(groups.get(key) ?? []), interview]);
  }
  return [...groups.entries()];
}

function dayHeading(interview: Interview) {
  const date = new Date(interview.scheduledAt);
  const relative = formatRelativeDay(date);
  const long = formatLongDate(date);
  return /^(Today|Tomorrow|Yesterday)$/.test(relative) ? `${relative} · ${long}` : long;
}

export function InterviewList({ interviews, onEdit, onDelete, hideApplication, hideDayHeadings }: InterviewListProps) {
  const [now] = useState(() => Date.now());

  return (
    // @container: rows switch to a horizontal layout based on the list's own width, not the screen's.
    <div className="@container space-y-6">
      {groupByDay(interviews).map(([day, items]) => (
        <section key={day} aria-label={dayHeading(items[0]!)}>
          {!hideDayHeadings && (
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">{dayHeading(items[0]!)}</h3>
          )}
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {items.map((interview) => {
              const start = new Date(interview.scheduledAt);
              const end = interviewEndTime(interview);
              const type = INTERVIEW_TYPE_META[interview.interviewType];
              const result = INTERVIEW_RESULT_META[interview.result];
              const canJoin = interview.meetingLink && interview.result === 'pending' && (end ?? start).getTime() > now;
              return (
                <li key={interview.id} className="flex flex-col gap-3 p-4 @xl:flex-row @xl:items-center">
                  <div className="flex shrink-0 items-baseline gap-2 tabular-nums @xl:w-24 @xl:flex-col @xl:gap-0">
                    <span className="text-sm font-semibold whitespace-nowrap text-slate-900">{formatTime(start)}</span>
                    {end && <span className="text-xs whitespace-nowrap text-slate-400">to {formatTime(end)}</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    {!hideApplication && (
                      <Link
                        to={`/applications/${interview.application.id}`}
                        className="block truncate text-sm font-medium text-slate-900 hover:text-brand-700"
                      >
                        {interview.application.company.name} — {interview.application.jobTitle}
                      </Link>
                    )}
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                      <span className={hideApplication ? 'font-medium text-slate-900' : undefined}>{interview.round}</span>
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <type.icon className="size-3.5" aria-hidden="true" /> {type.label}
                      </span>
                      <Badge tone={result.tone}>{result.label}</Badge>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 self-end @xl:self-auto">
                    {canJoin && (
                      <a
                        href={interview.meetingLink!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonClasses({ size: 'sm', className: 'mr-1' })}
                      >
                        <Video className="size-4" aria-hidden="true" /> Join
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => onEdit(interview)}
                      className={buttonClasses({ variant: 'ghost', size: 'icon', className: 'size-8' })}
                      aria-label={`Edit ${interview.round} with ${interview.application.company.name}`}
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(interview)}
                      className={buttonClasses({ variant: 'ghost', size: 'icon', className: 'size-8 hover:bg-rose-50 hover:text-rose-600' })}
                      aria-label={`Delete ${interview.round} with ${interview.application.company.name}`}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
