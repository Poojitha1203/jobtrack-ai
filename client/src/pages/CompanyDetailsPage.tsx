import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft, BriefcaseBusiness, ExternalLink, FileSearch, Mail, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Alert } from '../components/ui/Alert.tsx';
import { EmptyState } from '../components/ui/EmptyState.tsx';
import { Skeleton } from '../components/ui/Skeleton.tsx';
import { StatusBadge } from '../components/ui/StatusBadge.tsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.tsx';
import { CompanyAvatar } from '../components/companies/CompanyAvatar.tsx';
import { CompanyFormModal } from '../components/companies/CompanyFormModal.tsx';
import { ApplicationFormModal } from '../components/applications/ApplicationFormModal.tsx';
import { useAsyncData } from '../hooks/useAsyncData.ts';
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts';
import { useToast } from '../hooks/useToast.ts';
import { ApiError } from '../services/api.ts';
import { deleteCompany, getCompany } from '../services/companies.ts';
import { listApplications } from '../services/applications.ts';
import { buttonClasses } from '../lib/buttonStyles.ts';
import { displayDomain } from '../lib/companyForm.ts';
import { formatDateOnly } from '../lib/format.ts';

const backLink = (
  <Link to="/companies" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
    <ArrowLeft className="size-4" aria-hidden="true" /> All companies
  </Link>
);

export function CompanyDetailsPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();

  const companyData = useAsyncData(() => getCompany(id), `company:${id}`);
  const apps = useAsyncData(
    () => listApplications({ companyId: id, sort: 'appliedAt', order: 'desc', page: 1, pageSize: 100 }),
    `company-apps:${id}`,
  );
  const company = companyData.data?.id === id ? companyData.data : undefined;
  useDocumentTitle(company?.name ?? 'Company');

  const [editing, setEditing] = useState(false);
  const [addingApplication, setAddingApplication] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (companyData.error) {
    const notFound = companyData.error instanceof ApiError && companyData.error.status === 404;
    return (
      <div className="space-y-6">
        {backLink}
        <Card>
          {notFound ? (
            <EmptyState
              icon={FileSearch}
              title="Company not found"
              description="It may have been deleted, or the link is incorrect."
              action={<Link to="/companies" className={buttonClasses({ variant: 'secondary' })}>Back to companies</Link>}
            />
          ) : (
            <div className="p-5">
              <Alert tone="error" title="Couldn't load this company">
                {companyData.error.message}{' '}
                <button type="button" onClick={companyData.reload} className="font-medium underline">Try again</button>
              </Alert>
            </div>
          )}
        </Card>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading company">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-28 rounded-xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-xl lg:col-span-2" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  const hasApplications = company.applicationCount > 0;

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteCompany(company.id);
      showToast(`Deleted ${company.name}`);
      navigate('/companies', { replace: true });
    } catch (error) {
      setDeleting(false);
      setConfirmingDelete(false);
      showToast(error instanceof Error ? error.message : 'Could not delete the company', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {backLink}

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <CompanyAvatar name={company.name} size="lg" />
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight break-words text-slate-900">{company.name}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                {company.industry && <span>{company.industry}</span>}
                {company.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4 text-slate-400" aria-hidden="true" /> {company.location}
                  </span>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700"
                  >
                    {displayDomain(company.website)} <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                )}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <Pencil className="size-4" aria-hidden="true" /> Edit
            </Button>
            <Button
              variant="secondary"
              onClick={() => setConfirmingDelete(true)}
              disabled={hasApplications}
              title={hasApplications ? 'Delete or reassign its applications first' : undefined}
              className="text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="size-4" aria-hidden="true" /> Delete
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="self-start overflow-hidden lg:col-span-2">
          <CardHeader
            title="Applications"
            description={`${company.applicationCount} at ${company.name}`}
            action={
              <Button size="sm" variant="secondary" onClick={() => setAddingApplication(true)}>
                <Plus className="size-4" aria-hidden="true" /> Add
              </Button>
            }
          />
          {apps.error && (
            <div className="p-5">
              <Alert tone="error">{apps.error.message}</Alert>
            </div>
          )}
          {!apps.data && !apps.error && <Skeleton className="m-5 h-24" />}
          {apps.data && apps.data.items.length === 0 && (
            <EmptyState
              icon={BriefcaseBusiness}
              title="No applications here yet"
              description="Track a role at this company to see it listed here."
            />
          )}
          {apps.data && apps.data.items.length > 0 && (
            <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
              {apps.data.items.map((app) => (
                <li key={app.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50/70">
                  <div className="min-w-0 flex-1">
                    <Link to={`/applications/${app.id}`} className="block truncate text-sm font-medium text-slate-900 hover:text-brand-700">
                      {app.jobTitle}
                    </Link>
                    <p className="text-xs text-slate-500">Applied {formatDateOnly(app.appliedAt, '—')}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Contact" />
            <div className="p-5 text-sm">
              {company.contactName || company.contactEmail ? (
                <div className="space-y-1">
                  {company.contactName && <p className="font-medium text-slate-900">{company.contactName}</p>}
                  {company.contactEmail && (
                    <a href={`mailto:${company.contactEmail}`} className="inline-flex items-center gap-1.5 break-all text-brand-600 hover:text-brand-700">
                      <Mail className="size-4 shrink-0" aria-hidden="true" /> {company.contactEmail}
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-slate-500">No contact saved.</p>
              )}
            </div>
          </Card>
          <Card>
            <CardHeader title="Notes" />
            <div className="p-5">
              {company.notes ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-700">{company.notes}</p>
              ) : (
                <p className="text-sm text-slate-500">No notes yet.</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      <CompanyFormModal
        open={editing}
        company={company}
        onClose={() => setEditing(false)}
        onSaved={(updated) => {
          setEditing(false);
          companyData.setData(() => updated);
          showToast('Company updated');
        }}
      />

      <ApplicationFormModal
        open={addingApplication}
        defaults={{ companyName: company.name }}
        onClose={() => setAddingApplication(false)}
        onSaved={(saved) => {
          setAddingApplication(false);
          showToast(`Added ${saved.jobTitle}`);
          apps.reload();
          companyData.reload();
        }}
      />

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete company?"
        message={<><strong className="text-slate-900">{company.name}</strong> and its contact details and notes will be permanently deleted.</>}
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
