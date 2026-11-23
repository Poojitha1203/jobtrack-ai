import { Link } from 'react-router';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge.tsx';
import { buttonClasses } from '../../lib/buttonStyles.ts';
import { cn } from '../../lib/cn.ts';
import { formatDateOnly, formatSalary } from '../../lib/format.ts';
import { WORK_MODE_LABELS } from '../../lib/applicationOptions.ts';
import type { Application } from '../../types/application.ts';

interface ApplicationsTableProps {
  items: Application[];
  /** Dims the rows while a new page/search is loading. */
  stale?: boolean;
  onEdit: (application: Application) => void;
  onDelete: (application: Application) => void;
}

function locationLabel(app: Application) {
  const parts = [app.location, app.workMode ? WORK_MODE_LABELS[app.workMode] : null].filter(Boolean);
  return parts.length ? parts.join(' · ') : '—';
}

function RowActions({ app, onEdit, onDelete }: { app: Application } & Pick<ApplicationsTableProps, 'onEdit' | 'onDelete'>) {
  return (
    <div className="flex items-center justify-end gap-1">
      {app.jobUrl && (
        <a
          href={app.jobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses({ variant: 'ghost', size: 'icon', className: 'size-8' })}
          aria-label={`Open job posting for ${app.jobTitle} (new tab)`}
        >
          <ExternalLink className="size-4" aria-hidden="true" />
        </a>
      )}
      <button
        type="button"
        onClick={() => onEdit(app)}
        className={buttonClasses({ variant: 'ghost', size: 'icon', className: 'size-8' })}
        aria-label={`Edit ${app.jobTitle} at ${app.company.name}`}
      >
        <Pencil className="size-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(app)}
        className={buttonClasses({ variant: 'ghost', size: 'icon', className: 'size-8 hover:bg-rose-50 hover:text-rose-600' })}
        aria-label={`Delete ${app.jobTitle} at ${app.company.name}`}
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function ApplicationsTable({ items, stale, onEdit, onDelete }: ApplicationsTableProps) {
  return (
    <div className={cn('transition-opacity', stale && 'opacity-60')} aria-busy={stale || undefined}>
      {/* Desktop / tablet: table */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Role</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="hidden px-4 py-3 font-medium lg:table-cell">Location</th>
              <th scope="col" className="hidden px-4 py-3 font-medium md:table-cell">Applied</th>
              <th scope="col" className="hidden px-4 py-3 font-medium xl:table-cell">Salary</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((app) => (
              <tr key={app.id} className="hover:bg-slate-50/70">
                <td className="w-full max-w-0 px-4 py-3">
                  <Link to={`/applications/${app.id}`} className="block truncate font-medium text-slate-900 hover:text-brand-700">
                    {app.jobTitle}
                  </Link>
                  <p className="truncate text-slate-500">{app.company.name}</p>
                </td>
                <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                <td className="hidden px-4 py-3 whitespace-nowrap text-slate-600 lg:table-cell">{locationLabel(app)}</td>
                <td className="hidden px-4 py-3 whitespace-nowrap text-slate-600 md:table-cell">{formatDateOnly(app.appliedAt)}</td>
                <td className="hidden px-4 py-3 whitespace-nowrap text-slate-600 xl:table-cell">
                  {formatSalary(app.salaryMin, app.salaryMax, app.salaryCurrency) ?? '—'}
                </td>
                <td className="px-2 py-3"><RowActions app={app} onEdit={onEdit} onDelete={onDelete} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards */}
      <ul className="space-y-3 sm:hidden">
        {items.map((app) => (
          <li key={app.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link to={`/applications/${app.id}`} className="block truncate font-medium text-slate-900">
                  {app.jobTitle}
                </Link>
                <p className="truncate text-sm text-slate-500">{app.company.name}</p>
              </div>
              <StatusBadge status={app.status} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="truncate text-xs text-slate-500">
                {formatDateOnly(app.appliedAt, 'Not applied yet')} · {locationLabel(app)}
              </p>
              <RowActions app={app} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ApplicationsTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white" role="status" aria-label="Loading applications">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-slate-100 px-4 py-4 last:border-0">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 max-w-full animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="h-5 w-20 animate-pulse rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
