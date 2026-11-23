import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Building2, Plus, Search, SearchX } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Card } from '../components/ui/Card.tsx';
import { Alert } from '../components/ui/Alert.tsx';
import { EmptyState } from '../components/ui/EmptyState.tsx';
import { Skeleton } from '../components/ui/Skeleton.tsx';
import { CompanyCard } from '../components/companies/CompanyCard.tsx';
import { CompanyFormModal } from '../components/companies/CompanyFormModal.tsx';
import { useAsyncData } from '../hooks/useAsyncData.ts';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback.ts';
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts';
import { useToast } from '../hooks/useToast.ts';
import { listCompanies } from '../services/companies.ts';
import { cn } from '../lib/cn.ts';
import { inputClasses } from '../lib/formStyles.ts';

export function CompaniesPage() {
  useDocumentTitle('Companies');
  const navigate = useNavigate();
  const showToast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const [search, setSearch] = useState(query);
  const [formOpen, setFormOpen] = useState(false);

  const { data, error, loading, reload } = useAsyncData(() => listCompanies(query), `companies:${query}`);

  const applySearch = useDebouncedCallback((value: string) => {
    setSearchParams(value.trim() ? { q: value.trim() } : {}, { replace: true });
  }, 350);

  const addButton = (
    <Button onClick={() => setFormOpen(true)}>
      <Plus className="size-4" aria-hidden="true" /> Add company
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies"
        description="Everywhere you've applied or want to — with contacts and notes in one place."
        actions={addButton}
      />

      <div className="relative max-w-md">
        <label htmlFor="company-search" className="sr-only">Search companies</label>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          id="company-search"
          type="search"
          placeholder="Search by name, industry, location or contact…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            applySearch(e.target.value);
          }}
          className={inputClasses(false, 'pl-9')}
        />
      </div>

      {error && (
        <Alert tone="error" title="Couldn't load companies">
          {error.message}{' '}
          <button type="button" onClick={reload} className="font-medium underline">Try again</button>
        </Alert>
      )}

      {!data && !error && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading companies">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      )}

      {data && data.length === 0 && (
        <Card>
          {query ? (
            <EmptyState
              icon={SearchX}
              title="No matching companies"
              description={`Nothing matches “${query}”.`}
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch('');
                    setSearchParams({}, { replace: true });
                  }}
                >
                  Clear search
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Building2}
              title="No companies yet"
              description="Companies are added automatically when you add an application — or add one here to keep contacts and notes."
              action={addButton}
            />
          )}
        </Card>
      )}

      {data && data.length > 0 && (
        <ul className={cn('grid gap-4 transition-opacity sm:grid-cols-2 xl:grid-cols-3', loading && 'opacity-60')}>
          {data.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </ul>
      )}

      <CompanyFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={(company) => {
          setFormOpen(false);
          showToast(`Added ${company.name}`);
          navigate(`/companies/${company.id}`);
        }}
      />
    </div>
  );
}
