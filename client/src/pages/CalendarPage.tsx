import { useState } from 'react';
import { BellPlus, CalendarX, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Card, CardHeader } from '../components/ui/Card.tsx';
import { Alert } from '../components/ui/Alert.tsx';
import { EmptyState } from '../components/ui/EmptyState.tsx';
import { InterviewList } from '../components/interviews/InterviewList.tsx';
import { ReminderList } from '../components/reminders/ReminderList.tsx';
import { useAsyncData } from '../hooks/useAsyncData.ts';
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts';
import { useInterviewDialogs } from '../hooks/useInterviewDialogs.tsx';
import { useReminderDialogs } from '../hooks/useReminderDialogs.tsx';
import { listInterviews } from '../services/interviews.ts';
import { listReminders } from '../services/reminders.ts';
import { addDays, formatLongDate, formatTime, startOfWeek } from '../lib/date.ts';
import { parseDateOnly, toDateOnly } from '../lib/format.ts';
import { cn } from '../lib/cn.ts';
import type { Interview } from '../types/interview.ts';
import type { Reminder } from '../types/reminder.ts';

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
  const reminders = useAsyncData(
    () => listReminders({ status: 'all', from: gridStart.toISOString(), to: gridEnd.toISOString(), order: 'asc', limit: 500 }),
    `calendar-reminders:${toDateOnly(gridStart)}`,
  );
  const { openCreate, openEdit, openDelete, dialogs } = useInterviewDialogs(reload);
  const reminderDialogs = useReminderDialogs(reminders.reload);

  const byDay = new Map<string, Interview[]>();
  for (const interview of data ?? []) {
    const key = toDateOnly(new Date(interview.scheduledAt));
    byDay.set(key, [...(byDay.get(key) ?? []), interview]);
  }
  const remindersByDay = new Map<string, Reminder[]>();
  for (const reminder of reminders.data ?? []) {
    const key = toDateOnly(new Date(reminder.remindAt));
    remindersByDay.set(key, [...(remindersByDay.get(key) ?? []), reminder]);
  }
  const selectedInterviews = byDay.get(selectedDay) ?? [];
  const selectedReminders = remindersByDay.get(selectedDay) ?? [];

  const goToMonth = (next: Date) => {
    setMonth(next);
    setSelectedDay(toDateOnly(next.getMonth() === new Date().getMonth() && next.getFullYear() === new Date().getFullYear() ? new Date() : next));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="Interviews and reminders by date. Pick a day to see details or add something new."
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
                const dayReminders = remindersByDay.get(key) ?? [];
                const entries = [
                  ...items.map((i) => ({ id: i.id, at: i.scheduledAt, label: i.application.company.name, kind: 'interview' as const })),
                  ...dayReminders.map((r) => ({ id: r.id, at: r.remindAt, label: r.title, kind: 'reminder' as const, done: r.isCompleted })),
                ].sort((a, b) => a.at.localeCompare(b.at));
                const counts = [
                  items.length && `${items.length} interview${items.length > 1 ? 's' : ''}`,
                  dayReminders.length && `${dayReminders.length} reminder${dayReminders.length > 1 ? 's' : ''}`,
                ].filter(Boolean);
                const inMonth = day.getMonth() === month.getMonth();
                const isToday = key === today;
                const isSelected = key === selectedDay;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDay(key)}
                    aria-pressed={isSelected}
                    aria-label={[formatLongDate(day), ...counts].join(', ')}
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
                    {entries.length > 0 && (
                      <>
                        <span className="flex flex-wrap gap-0.5 sm:hidden" aria-hidden="true">
                          {entries.slice(0, 4).map((e) => (
                            <span key={e.id} className={cn('size-1.5 rounded-full', e.kind === 'interview' ? 'bg-violet-500' : 'bg-amber-500')} />
                          ))}
                        </span>
                        <span className="hidden w-full space-y-0.5 sm:block" aria-hidden="true">
                          {entries.slice(0, 2).map((e) => (
                            <span
                              key={e.id}
                              className={cn(
                                'block truncate rounded px-1.5 py-0.5 text-[11px] font-medium',
                                e.kind === 'interview' ? 'bg-violet-100 text-violet-800' : 'bg-amber-100 text-amber-900',
                                e.kind === 'reminder' && e.done && 'line-through opacity-60',
                              )}
                            >
                              {formatTime(new Date(e.at))} {e.label}
                            </span>
                          ))}
                          {entries.length > 2 && <span className="block px-1 text-[11px] text-slate-500">+{entries.length - 2} more</span>}
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
            description={`${selectedInterviews.length} interview${selectedInterviews.length === 1 ? '' : 's'} · ${selectedReminders.length} reminder${selectedReminders.length === 1 ? '' : 's'}`}
          />
          <div className="flex gap-2 px-5 pt-4">
            <Button size="sm" variant="secondary" onClick={() => openCreate({ date: selectedDay })}>
              <Plus className="size-4" aria-hidden="true" /> Interview
            </Button>
            <Button size="sm" variant="secondary" onClick={() => reminderDialogs.openCreate({ date: selectedDay })}>
              <BellPlus className="size-4" aria-hidden="true" /> Reminder
            </Button>
          </div>
          <div className="space-y-5 p-5">
            {selectedInterviews.length === 0 && selectedReminders.length === 0 && (
              <EmptyState icon={CalendarX} title="Nothing scheduled" description="This day is free." className="py-6" />
            )}
            {selectedInterviews.length > 0 && (
              <InterviewList interviews={selectedInterviews} onEdit={openEdit} onDelete={openDelete} hideDayHeadings />
            )}
            {selectedReminders.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Reminders</h3>
                <ReminderList
                  reminders={selectedReminders}
                  onToggleComplete={reminderDialogs.toggleComplete}
                  onEdit={reminderDialogs.openEdit}
                  onDelete={reminderDialogs.openDelete}
                />
              </section>
            )}
          </div>
        </Card>
      </div>

      {dialogs}
      {reminderDialogs.dialogs}
    </div>
  );
}
