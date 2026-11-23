import { useState } from 'react';
import { Plus, SquareKanban } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Card } from '../components/ui/Card.tsx';
import { Alert } from '../components/ui/Alert.tsx';
import { EmptyState } from '../components/ui/EmptyState.tsx';
import { Skeleton } from '../components/ui/Skeleton.tsx';
import { KanbanBoard } from '../components/kanban/KanbanBoard.tsx';
import { ApplicationFormModal } from '../components/applications/ApplicationFormModal.tsx';
import { useAsyncData } from '../hooks/useAsyncData.ts';
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts';
import { useToast } from '../hooks/useToast.ts';
import { listAllApplications } from '../services/applications.ts';
import { APPLICATION_STATUSES } from '../types/application.ts';

function BoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden" role="status" aria-label="Loading board">
      {APPLICATION_STATUSES.map((status) => (
        <div key={status} className="w-72 shrink-0 space-y-2 rounded-xl bg-slate-100 p-3">
          <Skeleton className="h-4 w-24" />
          <div className="h-24 w-full animate-pulse rounded-lg bg-white" />
          <div className="h-24 w-full animate-pulse rounded-lg bg-white" />
        </div>
      ))}
    </div>
  );
}

export function KanbanPage() {
  useDocumentTitle('Kanban board');
  const showToast = useToast();
  const { data, dataKey, error, reload } = useAsyncData(listAllApplications, 'kanban-board');
  const [formOpen, setFormOpen] = useState(false);

  const addButton = (
    <Button onClick={() => setFormOpen(true)}>
      <Plus className="size-4" aria-hidden="true" /> Add application
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kanban board"
        description="Drag cards between stages — changes save automatically. On touch screens, press and hold a card to drag it."
        actions={addButton}
      />

      {error && (
        <Alert tone="error" title="Couldn't load your board">
          {error.message}{' '}
          <button type="button" onClick={reload} className="font-medium underline">Try again</button>
        </Alert>
      )}

      {!data && !error && <BoardSkeleton />}

      {data && data.length === 0 && (
        <Card>
          <EmptyState
            icon={SquareKanban}
            title="Your board is empty"
            description="Add an application and it will appear in its stage column, ready to drag along as you progress."
            action={addButton}
            className="py-16"
          />
        </Card>
      )}

      {data && data.length > 0 && <KanbanBoard key={dataKey} initialApplications={data} />}

      <ApplicationFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={(saved) => {
          setFormOpen(false);
          showToast(`Added ${saved.jobTitle} at ${saved.company.name}`);
          reload();
        }}
      />
    </div>
  );
}
