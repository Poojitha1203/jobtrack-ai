import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { BriefcaseBusiness, Plus, SearchX } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Card } from '../components/ui/Card.tsx';
import { Alert } from '../components/ui/Alert.tsx';
import { EmptyState } from '../components/ui/EmptyState.tsx';
import { Pagination } from '../components/ui/Pagination.tsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.tsx';
import { ApplicationsToolbar } from '../components/applications/ApplicationsToolbar.tsx';
import { ApplicationsTable, ApplicationsTableSkeleton } from '../components/applications/ApplicationsTable.tsx';
import { ApplicationFormModal } from '../components/applications/ApplicationFormModal.tsx';
import { useAsyncData } from '../hooks/useAsyncData.ts';
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts';
import { useToast } from '../hooks/useToast.ts';
import { deleteApplication, listApplications } from '../services/applications.ts';
import { listCompanies } from '../services/companies.ts';
import {
  FILTER_KEYS,
  PAGE_SIZE,
  hasActiveFilters,
  readFilters,
  readPage,
  toApplicationQuery,
  type ApplicationUrlFilters,
} from '../lib/applicationFilters.ts';
import type { Application } from '../types/application.ts';

type FormState = { open: false } | { open: true; application?: Application };

export function ApplicationsPage() {
  useDocumentTitle('Applications');
  const showToast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = readFilters(searchParams);
  const page = readPage(searchParams);
  const query = toApplicationQuery(filters, page);

  const list = useAsyncData(() => listApplications(query), JSON.stringify(query));
  const companies = useAsyncData(listCompanies, 'companies');

  // /applications?new=1 (used by the dashboard button) opens the form straight away.
  const [form, setForm] = useState<FormState>(() =>
    searchParams.get('new') === '1' ? { open: true } : { open: false },
  );
  const [toDelete, setToDelete] = useState<Application | null>(null);
  const [deleting, setDeleting] = useState(false);

  const updateParams = (changes: Record<string, string | undefined>, resetPage = true) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        if (resetPage) next.delete('page');
        return next;
      },
      { replace: true },
    );
  };

  const handleFilterChange = (changes: Partial<ApplicationUrlFilters>) => updateParams(changes);

  const clearFilters = () =>
    updateParams(Object.fromEntries(FILTER_KEYS.filter((k) => k !== 'sort').map((k) => [k, undefined])));

  const closeForm = () => {
    setForm({ open: false });
    if (searchParams.has('new')) updateParams({ new: undefined }, false);
  };

  const handleSaved = (saved: Application, mode: 'created' | 'updated') => {
    closeForm();
    showToast(mode === 'created' ? `Added ${saved.jobTitle} at ${saved.company.name}` : 'Application updated');
    list.reload();
    if (mode === 'created') companies.reload();
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteApplication(toDelete.id);
      showToast('Application deleted');
      setToDelete(null);
      // Deleting the last row on a page → step back a page instead of showing an empty one.
      if (list.data && list.data.items.length === 1 && page > 1) updateParams({ page: String(page - 1) }, false);
      else list.reload();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not delete the application', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const data = list.data;
  const filtered = hasActiveFilters(filters);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applications"
        description={data ? `${data.total} ${filtered ? 'matching' : 'total'} application${data.total === 1 ? '' : 's'}` : 'Every job you are tracking.'}
        actions={
          <Button onClick={() => setForm({ open: true })}>
            <Plus className="size-4" aria-hidden="true" /> Add application
          </Button>
        }
      />

      <ApplicationsToolbar
        filters={filters}
        companies={companies.data ?? []}
        onChange={handleFilterChange}
        onClear={clearFilters}
      />

      {list.error && (
        <Alert tone="error" title="Couldn't load applications">
          {list.error.message}{' '}
          <button type="button" onClick={list.reload} className="font-medium underline">
            Try again
          </button>
        </Alert>
      )}

      {!data && !list.error && <ApplicationsTableSkeleton />}

      {data && data.total === 0 && (
        <Card>
          {filtered ? (
            <EmptyState
              icon={SearchX}
              title="No matching applications"
              description="Try a different search or remove some filters."
              action={<Button variant="secondary" onClick={clearFilters}>Clear filters</Button>}
            />
          ) : (
            <EmptyState
              icon={BriefcaseBusiness}
              title="No applications yet"
              description="Add the first job you've applied to — or one you're planning to apply to."
              action={
                <Button onClick={() => setForm({ open: true })}>
                  <Plus className="size-4" aria-hidden="true" /> Add application
                </Button>
              }
            />
          )}
        </Card>
      )}

      {data && data.total > 0 && (
        <>
          <ApplicationsTable
            items={data.items}
            stale={list.loading}
            onEdit={(application) => setForm({ open: true, application })}
            onDelete={setToDelete}
          />
          <Pagination
            page={data.page}
            pageSize={PAGE_SIZE}
            total={data.total}
            onPageChange={(next) => updateParams({ page: next > 1 ? String(next) : undefined }, false)}
          />
        </>
      )}

      <ApplicationFormModal
        open={form.open}
        application={form.open ? form.application : undefined}
        onClose={closeForm}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete application?"
        message={
          toDelete && (
            <>
              <strong className="text-slate-900">{toDelete.jobTitle}</strong> at {toDelete.company.name} will be
              permanently deleted, along with its interviews and reminders. This can&apos;t be undone.
            </>
          )
        }
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
