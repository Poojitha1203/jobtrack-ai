import { useState } from 'react';
import { BellOff, BellPlus, CheckCheck } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Card } from '../components/ui/Card.tsx';
import { Alert } from '../components/ui/Alert.tsx';
import { EmptyState } from '../components/ui/EmptyState.tsx';
import { Skeleton } from '../components/ui/Skeleton.tsx';
import { ReminderList } from '../components/reminders/ReminderList.tsx';
import { useAsyncData } from '../hooks/useAsyncData.ts';
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts';
import { useReminderDialogs } from '../hooks/useReminderDialogs.tsx';
import { listReminders } from '../services/reminders.ts';
import { groupOpenReminders } from '../lib/reminderForm.ts';
import { cn } from '../lib/cn.ts';
import type { Reminder } from '../types/reminder.ts';

type Tab = 'open' | 'completed';

function Section({ title, tone, reminders, actions }: {
  title: string;
  tone: 'danger' | 'default';
  reminders: Reminder[];
  actions: Omit<Parameters<typeof ReminderList>[0], 'reminders'>;
}) {
  if (reminders.length === 0) return null;
  return (
    <section className="space-y-2">
      <h2 className={cn('text-xs font-semibold tracking-wide uppercase', tone === 'danger' ? 'text-rose-600' : 'text-slate-500')}>
        {title} · {reminders.length}
      </h2>
      <ReminderList reminders={reminders} {...actions} />
    </section>
  );
}

export function RemindersPage() {
  useDocumentTitle('Reminders');
  const [tab, setTab] = useState<Tab>('open');
  const [now] = useState(() => Date.now());

  const { data, error, loading, reload } = useAsyncData(
    () =>
      tab === 'open'
        ? listReminders({ status: 'open', order: 'asc', limit: 500 })
        : listReminders({ status: 'completed', order: 'desc', limit: 100 }),
    `reminders:${tab}`,
  );
  const { openCreate, openEdit, openDelete, toggleComplete, dialogs } = useReminderDialogs(reload);
  const actions = { onToggleComplete: toggleComplete, onEdit: openEdit, onDelete: openDelete };

  const addButton = (
    <Button onClick={() => openCreate()}>
      <BellPlus className="size-4" aria-hidden="true" /> Add reminder
    </Button>
  );

  const groups = data && tab === 'open' ? groupOpenReminders(data, now) : null;

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Reminders"
        description="Follow-ups, deadlines and interview prep — due reminders also appear under the bell icon."
        actions={addButton}
      />

      <div role="tablist" aria-label="Reminder filter" className="inline-flex rounded-lg bg-slate-100 p-1">
        {(['open', 'completed'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium capitalize transition',
              tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div role="tabpanel" className={cn('space-y-6 transition-opacity', loading && data && 'opacity-60')}>
        {error && (
          <Alert tone="error" title="Couldn't load reminders">
            {error.message}{' '}
            <button type="button" onClick={reload} className="font-medium underline">Try again</button>
          </Alert>
        )}
        {!data && !error && (
          <div className="space-y-3" role="status" aria-label="Loading reminders">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        )}
        {data && data.length === 0 && (
          <Card>
            {tab === 'open' ? (
              <EmptyState
                icon={CheckCheck}
                title="You're all caught up"
                description="Add a reminder to follow up with a recruiter, prepare for an interview or hit an application deadline."
                action={addButton}
              />
            ) : (
              <EmptyState icon={BellOff} title="No completed reminders" description="Reminders you tick off will appear here." />
            )}
          </Card>
        )}
        {groups && (
          <>
            <Section title="Overdue" tone="danger" reminders={groups.overdue} actions={actions} />
            <Section title="Later today" tone="default" reminders={groups.today} actions={actions} />
            <Section title="Upcoming" tone="default" reminders={groups.upcoming} actions={actions} />
          </>
        )}
        {data && data.length > 0 && tab === 'completed' && <ReminderList reminders={data} {...actions} />}
      </div>

      {dialogs}
    </div>
  );
}
