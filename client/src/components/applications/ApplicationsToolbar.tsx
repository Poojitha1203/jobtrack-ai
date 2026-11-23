import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { SelectField } from '../ui/SelectField.tsx';
import { TextField } from '../ui/TextField.tsx';
import { Button } from '../ui/Button.tsx';
import { Badge } from '../ui/Badge.tsx';
import { inputClasses } from '../../lib/formStyles.ts';
import { STATUS_META } from '../../lib/status.ts';
import { JOB_TYPE_LABELS, SORT_OPTIONS, WORK_MODE_LABELS } from '../../lib/applicationOptions.ts';
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback.ts';
import { ADVANCED_FILTER_KEYS, type ApplicationUrlFilters } from '../../lib/applicationFilters.ts';
import { APPLICATION_STATUSES, JOB_TYPES, WORK_MODES, type CompanySummary } from '../../types/application.ts';

interface ApplicationsToolbarProps {
  filters: ApplicationUrlFilters;
  companies: CompanySummary[];
  onChange: (changes: Partial<ApplicationUrlFilters>) => void;
  onClear: () => void;
}

export function ApplicationsToolbar({ filters, companies, onChange, onClear }: ApplicationsToolbarProps) {
  const [search, setSearch] = useState(filters.q);
  const [location, setLocation] = useState(filters.location);
  const advancedCount = ADVANCED_FILTER_KEYS.filter((key) => filters[key]).length;
  const [showFilters, setShowFilters] = useState(advancedCount > 0);
  const hasAnyFilter = Boolean(filters.q || filters.status || advancedCount);

  const applySearch = useDebouncedCallback((value: string) => onChange({ q: value.trim() }), 350);
  const applyLocation = useDebouncedCallback((value: string) => onChange({ location: value.trim() }), 350);

  const clearAll = () => {
    setSearch('');
    setLocation('');
    onClear();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <label htmlFor="application-search" className="sr-only">
            Search applications
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            id="application-search"
            type="search"
            placeholder="Search by title, company, location, source or notes…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              applySearch(e.target.value);
            }}
            className={inputClasses(false, 'pl-9')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex">
          <SelectField
            label="Status"
            hideLabel
            value={filters.status}
            onChange={(e) => onChange({ status: e.target.value })}
            className="sm:w-40"
          >
            <option value="">All statuses</option>
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Sort by"
            hideLabel
            value={filters.sort}
            onChange={(e) => onChange({ sort: e.target.value })}
            className="sm:w-52"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </SelectField>
          <Button
            variant="secondary"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            aria-controls="advanced-filters"
            className="col-span-2 sm:col-span-1"
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            Filters
            {advancedCount > 0 && <Badge tone="brand">{advancedCount}</Badge>}
          </Button>
        </div>
      </div>

      {showFilters && (
        <div
          id="advanced-filters"
          className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <SelectField label="Company" value={filters.company} onChange={(e) => onChange({ company: e.target.value })}>
            <option value="">All companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
          <SelectField label="Job type" value={filters.type} onChange={(e) => onChange({ type: e.target.value })}>
            <option value="">Any type</option>
            {JOB_TYPES.map((t) => (
              <option key={t} value={t}>
                {JOB_TYPE_LABELS[t]}
              </option>
            ))}
          </SelectField>
          <SelectField label="Work mode" value={filters.mode} onChange={(e) => onChange({ mode: e.target.value })}>
            <option value="">Any work mode</option>
            {WORK_MODES.map((m) => (
              <option key={m} value={m}>
                {WORK_MODE_LABELS[m]}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Location contains"
            placeholder="e.g. Bengaluru"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              applyLocation(e.target.value);
            }}
          />
          <TextField
            label="Applied from"
            type="date"
            value={filters.from}
            max={filters.to || undefined}
            onChange={(e) => onChange({ from: e.target.value })}
          />
          <TextField
            label="Applied to"
            type="date"
            value={filters.to}
            min={filters.from || undefined}
            onChange={(e) => onChange({ to: e.target.value })}
          />
        </div>
      )}

      {hasAnyFilter && (
        <div>
          <Button variant="ghost" size="sm" onClick={clearAll}>
            <X className="size-4" aria-hidden="true" /> Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}
