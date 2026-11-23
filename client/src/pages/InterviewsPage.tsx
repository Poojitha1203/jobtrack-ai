import { useState } from 'react';
import { CalendarCheck, History, Plus } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Card } from '../components/ui/Card.tsx';
import { Alert } from '../components/ui/Alert.tsx';
import { EmptyState } from '../components/ui/EmptyState.tsx';
import { Skeleton } from '../components/ui/Skeleton.tsx';
import { InterviewList } from '../components/interviews/InterviewList.tsx';
import { useAsyncData } from '../hooks/useAsyncData.ts';
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts';
import { useInterviewDialogs } from '../hooks/useInterviewDialogs.tsx';
import { listInterviews } from '../services/interviews.ts';
import { startOfDay } from '../lib/date.ts';
import { cn } from '../lib/cn.ts';

type Tab = 'upcoming' | 'past';

const TABS: { id: Tab; label: string }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
];

export function InterviewsPage() {
  useDocumentTitle('Interviews');
  const [tab, setTab] = useState<Tab>('upcoming');
  // Today's earlier interviews stay under "Upcoming" until the day is over.
  const [boundary] = useState(() => startOfDay(new Date()).toISOString());

  const { data, error, loading, reload } = useAsyncData(
    () =>
      tab === 'upcoming'
        ? listInterviews({ from: boundary, order: 'asc' })
        : listInterviews({ to: boundary, order: 'desc' }),
    `interviews:${tab}`,
  );
  const { openCreate, openEdit, openDelete, dialogs } = useInterviewDialogs(reload);

  const scheduleButton = (
    <Button onClick={() => openCreate()}>
      <Plus className="size-4" aria-hidden="true" /> Schedule interview
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interviews"
        description="Every round, with prep notes, links and results in one place."
        actions={scheduleButton}
      />

      <div role="tablist" aria-label="Interview filter" className="inline-flex rounded-lg bg-slate-100 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium transition',
              tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className={cn('transition-opacity', loading && data && 'opacity-60')}>
        {error && (
          <Alert tone="error" title="Couldn't load interviews">
            {error.message}{' '}
            <button type="button" onClick={reload} className="font-medium underline">Try again</button>
          </Alert>
        )}
        {!data && !error && (
          <div className="space-y-3" role="status" aria-label="Loading interviews">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        )}
        {data && data.length === 0 && (
          <Card>
            {tab === 'upcoming' ? (
              <EmptyState
                icon={CalendarCheck}
                title="No upcoming interviews"
                description="When you get an interview, schedule it here to keep the time, link and prep notes together."
                action={scheduleButton}
              />
            ) : (
              <EmptyState icon={History} title="No past interviews" description="Completed interviews will appear here." />
            )}
          </Card>
        )}
        {data && data.length > 0 && <InterviewList interviews={data} onEdit={openEdit} onDelete={openDelete} />}
      </div>

      {dialogs}
    </div>
  );
}
