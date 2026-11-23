import { Link } from 'react-router';
import { Globe, MapPin, UserRound } from 'lucide-react';
import { CompanyAvatar } from './CompanyAvatar.tsx';
import { Badge } from '../ui/Badge.tsx';
import { displayDomain } from '../../lib/companyForm.ts';
import type { Company } from '../../types/company.ts';

export function CompanyCard({ company }: { company: Company }) {
  return (
    <li className="relative flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-200 hover:shadow-md">
      <div className="flex items-start gap-3">
        <CompanyAvatar name={company.name} />
        <div className="min-w-0 flex-1">
          {/* The ::after overlay makes the whole card clickable while keeping one real link. */}
          <Link
            to={`/companies/${company.id}`}
            className="block truncate font-semibold text-slate-900 after:absolute after:inset-0 after:rounded-xl hover:text-brand-700"
          >
            {company.name}
          </Link>
          <p className="truncate text-sm text-slate-500">{company.industry ?? 'Industry not set'}</p>
        </div>
      </div>

      <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
        {company.location && (
          <li className="flex items-center gap-2 truncate">
            <MapPin className="size-4 shrink-0 text-slate-400" aria-hidden="true" /> {company.location}
          </li>
        )}
        {company.website && (
          <li className="flex items-center gap-2 truncate">
            <Globe className="size-4 shrink-0 text-slate-400" aria-hidden="true" /> {displayDomain(company.website)}
          </li>
        )}
        {company.contactName && (
          <li className="flex items-center gap-2 truncate">
            <UserRound className="size-4 shrink-0 text-slate-400" aria-hidden="true" /> {company.contactName}
          </li>
        )}
      </ul>

      <div className="mt-auto pt-4">
        <Badge tone={company.applicationCount > 0 ? 'brand' : 'neutral'}>
          {company.applicationCount} application{company.applicationCount === 1 ? '' : 's'}
        </Badge>
      </div>
    </li>
  );
}
