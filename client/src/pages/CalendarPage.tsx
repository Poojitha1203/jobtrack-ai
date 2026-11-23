import { useState } from 'react';
import { CalendarX, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Card, CardHeader } from '../components/ui/Card.tsx';
import { Alert } from '../components/ui/Alert.tsx';
import { EmptyState } from '../components/ui/EmptyState.tsx';
import { InterviewList } from '../components/interviews/InterviewList.tsx';
import { useAsyncData } from '../hooks/useAsyncData.ts';
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts';
import { useInterviewDialogs } from '../hooks/useInterviewDialogs.tsx';
import { listInterviews } from '../services/interviews.ts';
import { addDays, formatLongDate, formatTime, startOfWeek } from '../lib/date.ts';
import { parseDateOnly, toDateOnly } from '../lib/format.ts';
import { cn } from '../lib/cn.ts';
import type { Interview } from '../types/interview.ts';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const monthTitle = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });

const firstOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const shiftMonth = (date: Date, months: number) => new Date(date.getFullYear(), date.getMonth() + months, 1);

export function CalendarPage() {
  useDocumentTitle('Calendar');
  const today = toDateOnly(new Date());
  const [month, setMonth] = useState(() => firstOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(today);

  // Always 6 weeks (42 days), starting on the Monday on or before the 1st.
  const gridStart = startOfWeek(month);
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const gridEnd = addDays(gridStart, 42);

  const { data, error, loading, reload } = useAsyncData(
    () => listInterviews({ from: gridStart.toISOString(), to: gridEnd.toISOString(), order: 'asc', limit: 500 }),
    `calendar:${toDateOnly(gridStart)}`,
  );
  const { openCreate, openEdit, openDelete, dialogs } = useInterviewDialogs(reload);

  const byDay = new Map<string, Interview[]>();
  for (const interview of data ?? []) {
    const key = toDateOnly(new Date(interview.scheduledAt));
    byDay.set(key, [...(byDay.get(key) ?? []), interview]);
  }
  const selectedInterviews = byDay.get(selectedDay) ?? [];

  const goToMonth = (next: Date) => {
    setMonth(next);
    setSelectedDay(toDateOnly(next.getMonth() === new Date().getMonth() && next.getFullYear() === new Date().getFullYear() ? new Date() : next));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="Your interviews by date. Pick a day to see details or schedule something new."
        actions={
          <Button onClick={() => openCreate({ date: selectedDay })}>
            <Plus className="size-4" aria-hidden="true" /> Schedule interview
          </Button>
        }
      />

      {error && (
        <Alert tone="error" title="Couldn't load interviews">
          {error.message}{' '}
          <button type="button" onClick={reload} className="font-medium underline">Try again</button>
        </Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <h2 className="text-base font-semibold text-slate-900" aria-live="polite">
              {monthTitle.format(month)}
            </h2>
            <div className="flex items-center gap-1">
              <Button variant="secondary" size="sm" onClick={() => goToMonth(firstOfMonth(new Date()))}>
                Today
              </Button>
              <Button variant="ghost" size="icon" onClick={() => goToMonth(shiftMonth(month, -1))} aria-label="Previous month">
                <ChevronLeft className="size-5" aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => goToMonth(shiftMonth(month, 1))} aria-label="Next month">
                <ChevronRight className="size-5" aria-hidden="true" />
              </Button>
            </div>
          </div>

          <div className={cn('transition-opacity', loading && 'opacity-60')}>
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 text-center text-xs font-medium text-slate-500">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day) => {
                const key = toDateOnly(day);
                const items = byDay.get(key) ?? [];
                const inMonth = day.getMonth() === month.getMonth();
                const isToday = key === today;
                const isSelected = key === selectedDay;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDay(key)}
                    aria-pressed={isSelected}
                    aria-label={`${formatLongDate(day)}${items.length ? `, ${items.length} interview${items.length > 1 ? 's' : ''}` : ''}`}
                    className={cn(
                      'flex min-h-16 flex-col gap-1 border-r border-b border-slate-100 p-1.5 text-left transition-colors sm:min-h-24 sm:p-2 [&:nth-child(7n)]:border-r-0',
                      inMonth ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/60 text-slate-400 hover:bg-slate-100',
                      isSelected && 'bg-brand-50 ring-2 ring-brand-500 ring-inset hover:bg-brand-50',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-6 items-center justify-center rounded-full text-xs font-medium',
                        isToday && 'bg-brand-600 text-white',
                      )}
                    >
                      {day.getDate()}
                    </span>
                    {items.length > 0 && (
                      <>
                        <span className="flex flex-wrap gap-0.5 sm:hidden" aria-hidden="true">
                          {items.slice(0, 3).map((i) => (
                            <span key={i.id} className="size-1.5 rounded-full bg-violet-500" />
                          ))}
                        </span>
                        <span className="hidden w-full space-y-0.5 sm:block" aria-hidden="true">
                          {items.slice(0, 2).map((i) => (
                            <span key={i.id} className="block truncate rounded bg-violet-100 px-1.5 py-0.5 text-[11px] font-medium text-violet-800">
                              {formatTime(new Date(i.scheduledAt))} {i.application.company.name}
                            </span>
                          ))}
                          {items.length > 2 && <span className="block px-1 text-[11px] text-slate-500">+{items.length - 2} more</span>}
                        </span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <Card className="self-start">
          <CardHeader
            title={formatLongDate(parseDateOnly(selectedDay))}
            description={`${selectedInterviews.length} interview${selectedInterviews.length === 1 ? '' : 's'}`}
            action={
              <Button size="sm" variant="secondary" onClick={() => openCreate({ date: selectedDay })}>
                <Plus className="size-4" aria-hidden="true" /> Add
              </Button>
            }
          />
          <div className="p-5">
            {selectedInterviews.length === 0 ? (
              <EmptyState icon={CalendarX} title="Nothing scheduled" description="This day is free." className="py-6" />
            ) : (
              <InterviewList interviews={selectedInterviews} onEdit={openEdit} onDelete={openDelete} hideDayHeadings />
            )}
          </div>
        </Card>
      </div>

      {dialogs}
    </div>
  );
}
