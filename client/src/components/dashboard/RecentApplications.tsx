import { Link } from 'react-router';
import { BriefcaseBusiness } from 'lucide-react';
import { Card, CardHeader } from '../ui/Card.tsx';
import { StatusBadge } from '../ui/StatusBadge.tsx';
import { EmptyState } from '../ui/EmptyState.tsx';
import { formatShortDate } from '../../lib/date.ts';
import type { Application } from '../../types/application.ts';

const WORK_MODE_LABEL = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'On-site' } as const;

export function RecentApplications({ applications }: { applications: Application[] }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Recent applications"
        action={
          <Link to="/applications" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            View all
          </Link>
        }
      />

      {applications.length === 0 ? (
        <EmptyState
          icon={BriefcaseBusiness}
          title="No applications yet"
          description="Applications you add will show up here."
        />
      ) : (
        <table className="mt-4 w-full text-left text-sm">
          <thead className="border-y border-slate-100 bg-slate-50 text-xs text-slate-500">
            <tr>
              <th scope="col" className="px-5 py-2.5 font-medium">Role</th>
              <th scope="col" className="hidden px-5 py-2.5 font-medium md:table-cell">Location</th>
              <th scope="col" className="hidden px-5 py-2.5 font-medium sm:table-cell">Applied</th>
              <th scope="col" className="px-5 py-2.5 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {applications.map((app) => (
              <tr key={app.id} className="hover:bg-slate-50/60">
                {/* w-full + max-w-0 lets this column take the leftover width and truncate long text */}
                <td className="w-full max-w-0 px-5 py-3">
                  <p className="truncate font-medium text-slate-900">{app.jobTitle}</p>
                  <p className="truncate text-slate-500">{app.company}</p>
                </td>
                <td className="hidden px-5 py-3 whitespace-nowrap text-slate-600 md:table-cell">
                  {app.location}
                  <span className="text-slate-400"> · {WORK_MODE_LABEL[app.workMode]}</span>
                </td>
                <td className="hidden px-5 py-3 whitespace-nowrap text-slate-600 sm:table-cell">
                  {app.appliedAt ? formatShortDate(new Date(app.appliedAt)) : '—'}
                </td>
                <td className="px-5 py-3 text-right">
                  <StatusBadge status={app.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
