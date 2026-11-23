import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard.tsx';
import { STATUS_META } from '../../lib/status.ts';
import { columnDropId } from '../../lib/kanban.ts';
import { cn } from '../../lib/cn.ts';
import type { Application, ApplicationStatus } from '../../types/application.ts';

interface KanbanColumnProps {
  status: ApplicationStatus;
  applications: Application[];
  highlighted: boolean;
  isDragActive: boolean;
  onOpen: (id: string) => void;
}

export function KanbanColumn({ status, applications, highlighted, isDragActive, onOpen }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id: columnDropId(status) });
  const meta = STATUS_META[status];
  const headingId = `kanban-column-${status}`;

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        'flex w-72 shrink-0 snap-start flex-col rounded-xl bg-slate-100 transition-colors',
        highlighted && 'bg-brand-50 ring-2 ring-brand-200',
      )}
    >
      <header className="flex items-center gap-2 px-3 pt-3 pb-2">
        <span className={cn('size-2.5 rounded-full', meta.barClass)} aria-hidden="true" />
        <h2 id={headingId} className="text-sm font-semibold text-slate-700">
          {meta.label}
        </h2>
        <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500 tabular-nums">
          {applications.length}
        </span>
      </header>

      <SortableContext items={applications.map((a) => a.id)} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} className="flex min-h-40 flex-1 flex-col gap-2 p-2">
          {applications.map((app) => (
            <KanbanCard key={app.id} application={app} isDragActive={isDragActive} onOpen={onOpen} />
          ))}
          {applications.length === 0 && (
            <li className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
              Drop cards here
            </li>
          )}
        </ul>
      </SortableContext>
    </section>
  );
}
