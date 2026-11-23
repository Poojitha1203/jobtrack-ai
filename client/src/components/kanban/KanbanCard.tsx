import type { KeyboardEvent } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarDays, MapPin } from 'lucide-react';
import { cn } from '../../lib/cn.ts';
import { formatDateOnly, formatSalary } from '../../lib/format.ts';
import { WORK_MODE_LABELS } from '../../lib/applicationOptions.ts';
import type { Application } from '../../types/application.ts';

export function KanbanCardContent({ application, overlay = false }: { application: Application; overlay?: boolean }) {
  const salary = formatSalary(application.salaryMin, application.salaryMax, application.salaryCurrency);
  const place = [application.location, application.workMode ? WORK_MODE_LABELS[application.workMode] : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      className={cn(
        'rounded-lg border border-slate-200 bg-white p-3 shadow-sm',
        overlay && 'rotate-2 cursor-grabbing shadow-lg ring-2 ring-brand-500/40',
      )}
    >
      <p className="line-clamp-2 text-sm font-medium text-slate-900">{application.jobTitle}</p>
      <p className="mt-0.5 truncate text-sm text-slate-500">{application.company.name}</p>
      {place && (
        <p className="mt-2 flex items-center gap-1 truncate text-xs text-slate-500">
          <MapPin className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" /> {place}
        </p>
      )}
      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <CalendarDays className="size-3.5 text-slate-400" aria-hidden="true" />
          {formatDateOnly(application.appliedAt, 'Not applied')}
        </span>
        {salary && <span className="truncate font-medium text-slate-600">{salary}</span>}
      </div>
    </div>
  );
}

interface KanbanCardProps {
  application: Application;
  isDragActive: boolean;
  onOpen: (id: string) => void;
}

export function KanbanCard({ application, isDragActive, onOpen }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: application.id,
  });

  const handleKeyDown = (event: KeyboardEvent<HTMLLIElement>) => {
    if (event.key === 'Enter' && !isDragActive) {
      onOpen(application.id);
      return;
    }
    listeners?.onKeyDown?.(event);
  };

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onKeyDown={handleKeyDown}
      onClick={() => onOpen(application.id)}
      aria-label={`${application.jobTitle} at ${application.company.name}`}
      className={cn(
        'cursor-grab rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
        isDragging && 'opacity-40',
      )}
    >
      <KanbanCardContent application={application} />
    </li>
  );
}
