import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft, Building2, ExternalLink, FileSearch, MapPin, Pencil, Trash2 } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Alert } from '../components/ui/Alert.tsx';
import { EmptyState } from '../components/ui/EmptyState.tsx';
import { Skeleton } from '../components/ui/Skeleton.tsx';
import { SelectField } from '../components/ui/SelectField.tsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.tsx';
import { ApplicationFormModal } from '../components/applications/ApplicationFormModal.tsx';
import { useAsyncData } from '../hooks/useAsyncData.ts';
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts';
import { useToast } from '../hooks/useToast.ts';
import { ApiError } from '../services/api.ts';
import { deleteApplication, getApplication, updateApplication } from '../services/applications.ts';
import { buttonClasses } from '../lib/buttonStyles.ts';
import { STATUS_META } from '../lib/status.ts';
import { JOB_TYPE_LABELS, WORK_MODE_LABELS } from '../lib/applicationOptions.ts';
import { formatDateOnly, formatDateTime, formatSalary } from '../lib/format.ts';
import { appliedDateForStatus } from '../lib/applicationForm.ts';
import { APPLICATION_STATUSES, type ApplicationStatus } from '../types/application.ts';

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="min-w-0 text-right font-medium break-words text-slate-900">{children}</dd>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading application">
      <Skeleton className="h-4 w-36" />
      <Skeleton className="h-28 w-full rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-xl lg:col-span-2" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

const backLink = (
  <Link to="/applications" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
    <ArrowLeft className="size-4" aria-hidden="true" /> All applications
  </Link>
);

export function ApplicationDetailsPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const { data, error, reload, setData } = useAsyncData(() => getApplication(id), id);
  const app = data?.id === id ? data : undefined;
  useDocumentTitle(app ? `${app.jobTitle} · ${app.company.name}` : 'Application');

  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  if (error) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="space-y-6">
        {backLink}
        <Card>
          {notFound ? (
            <EmptyState
              icon={FileSearch}
              title="Application not found"
              description="It may have been deleted, or the link is incorrect."
              action={<Link to="/applications" className={buttonClasses({ variant: 'secondary' })}>Back to applications</Link>}
            />
          ) : (
            <div className="p-5">
              <Alert tone="error" title="Couldn't load this application">
                {error.message}{' '}
                <button type="button" onClick={reload} className="font-medium underline">Try again</button>
              </Alert>
            </div>
          )}
        </Card>
      </div>
    );
  }

  if (!app) return <DetailsSkeleton />;

  const changeStatus = async (status: ApplicationStatus) => {
    setSavingStatus(true);
    try {
      const appliedAt = appliedDateForStatus(status, app.appliedAt);
      const updated = await updateApplication(app.id, appliedAt !== app.appliedAt ? { status, appliedAt } : { status });
      setData(() => updated);
      showToast(`Status changed to ${STATUS_META[status].label}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update status', 'error');
    } finally {
      setSavingStatus(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteApplication(app.id);
      showToast('Application deleted');
      navigate('/applications', { replace: true });
    } catch (err) {
      setDeleting(false);
      showToast(err instanceof Error ? err.message : 'Could not delete the application', 'error');
    }
  };

  const salary = formatSalary(app.salaryMin, app.salaryMax, app.salaryCurrency);

  return (
    <div className="space-y-6">
      {backLink}

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight break-words text-slate-900">{app.jobTitle}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="size-4 text-slate-400" aria-hidden="true" />
                <Link to={`/companies/${app.company.id}`} className="hover:text-brand-700 hover:underline">
                  {app.company.name}
                </Link>
              </span>
              {app.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4 text-slate-400" aria-hidden="true" /> {app.location}
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <SelectField
              label="Status"
              hideLabel
              value={app.status}
              disabled={savingStatus}
              onChange={(e) => void changeStatus(e.target.value as ApplicationStatus)}
              className="w-40"
            >
              {APPLICATION_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_META[s].label}</option>
              ))}
            </SelectField>
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <Pencil className="size-4" aria-hidden="true" /> Edit
            </Button>
            <Button variant="secondary" onClick={() => setConfirmingDelete(true)} className="text-rose-600 hover:bg-rose-50">
              <Trash2 className="size-4" aria-hidden="true" /> Delete
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Job description" />
            <div className="p-5">
              {app.jobDescription ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-700">{app.jobDescription}</p>
              ) : (
                <p className="text-sm text-slate-500">
                  No description saved. <button type="button" onClick={() => setEditing(true)} className="font-medium text-brand-600 hover:text-brand-700">Paste one in</button> to use it with the Job Match analyzer later.
                </p>
              )}
            </div>
          </Card>
          <Card>
            <CardHeader title="Notes" />
            <div className="p-5">
              {app.notes ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-700">{app.notes}</p>
              ) : (
                <p className="text-sm text-slate-500">No notes yet.</p>
              )}
            </div>
          </Card>
        </div>

        <Card className="self-start">
          <CardHeader title="Details" />
          <dl className="divide-y divide-slate-100 px-5 pt-2 pb-3">
            <DetailRow label="Applied">{formatDateOnly(app.appliedAt, 'Not yet')}</DetailRow>
            <DetailRow label="Job type">{app.jobType ? JOB_TYPE_LABELS[app.jobType] : '—'}</DetailRow>
            <DetailRow label="Work mode">{app.workMode ? WORK_MODE_LABELS[app.workMode] : '—'}</DetailRow>
            <DetailRow label="Salary">{salary ?? '—'}</DetailRow>
            <DetailRow label="Source">{app.source ?? '—'}</DetailRow>
            <DetailRow label="Job posting">
              {app.jobUrl ? (
                <a href={app.jobUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700">
                  Open link <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
              ) : (
                '—'
              )}
            </DetailRow>
            <DetailRow label="Added">{formatDateTime(app.createdAt)}</DetailRow>
            <DetailRow label="Last updated">{formatDateTime(app.updatedAt)}</DetailRow>
          </dl>
        </Card>
      </div>

      <ApplicationFormModal
        open={editing}
        application={app}
        onClose={() => setEditing(false)}
        onSaved={(updated) => {
          setEditing(false);
          setData(() => updated);
          showToast('Application updated');
        }}
      />

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete application?"
        message={
          <>
            <strong className="text-slate-900">{app.jobTitle}</strong> at {app.company.name} will be permanently deleted,
            along with its interviews and reminders. This can&apos;t be undone.
          </>
        }
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
