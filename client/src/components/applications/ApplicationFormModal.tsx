import { Loader2 } from 'lucide-react';
import { Modal } from '../ui/Modal.tsx';
import { Alert } from '../ui/Alert.tsx';
import { ApplicationForm } from './ApplicationForm.tsx';
import { useAsyncData } from '../../hooks/useAsyncData.ts';
import { ApiError } from '../../services/api.ts';
import { createApplication, getApplication, updateApplication } from '../../services/applications.ts';
import { listCompanies } from '../../services/companies.ts';
import { listResumes } from '../../services/resumes.ts';
import {
  changedFields,
  toApplicationInput,
  toFormValues,
  type ApplicationFormErrors,
  type ApplicationFormValues,
} from '../../lib/applicationForm.ts';
import type { Application } from '../../types/application.ts';

interface ApplicationFormModalProps {
  open: boolean;
  /** Pass an application to edit it; leave empty to create a new one. */
  application?: Application;
  /** Pre-filled values for a NEW application, e.g. { companyName } from a company page. */
  defaults?: Partial<ApplicationFormValues>;
  onClose: () => void;
  onSaved: (application: Application, mode: 'created' | 'updated') => void;
}

function toFormErrors(error: unknown): ApplicationFormErrors {
  if (error instanceof ApiError && error.details) {
    return Object.fromEntries(Object.entries(error.details).map(([field, messages]) => [field, messages[0]]));
  }
  return { _form: error instanceof Error ? error.message : 'Could not save the application' };
}

function FormBody({ application, defaults, onClose, onSaved }: Omit<ApplicationFormModalProps, 'open'>) {
  const companies = useAsyncData(listCompanies, 'companies');
  const resumes = useAsyncData(listResumes, 'form-resumes');
  // List rows don't include the (long) job description, so load the full record before editing.
  const full = useAsyncData(
    () =>
      !application || application.jobDescription !== undefined
        ? Promise.resolve(application)
        : getApplication(application.id),
    application?.id ?? 'new',
  );

  if (application && full.error) {
    return (
      <div className="p-6">
        <Alert tone="error">{full.error.message}</Alert>
      </div>
    );
  }
  if ((application && !full.data) || (!resumes.data && !resumes.error)) {
    return (
      <div className="flex justify-center p-12" role="status">
        <Loader2 className="size-6 animate-spin text-brand-600" aria-label="Loading application" />
      </div>
    );
  }

  const existing = full.data;
  const defaultResumeId = resumes.data?.find((r) => r.isDefault)?.id ?? '';
  const initialValues = existing
    ? toFormValues(existing)
    : { ...toFormValues(), resumeId: defaultResumeId, ...defaults };

  const handleSubmit = async (values: typeof initialValues) => {
    try {
      if (existing) {
        const changes = changedFields(toApplicationInput(values), toApplicationInput(initialValues));
        if (Object.keys(changes).length === 0) {
          onClose();
          return;
        }
        onSaved(await updateApplication(existing.id, changes), 'updated');
      } else {
        onSaved(await createApplication(toApplicationInput(values)), 'created');
      }
    } catch (error) {
      return toFormErrors(error);
    }
  };

  return (
    <ApplicationForm
      initialValues={initialValues}
      companies={companies.data ?? []}
      resumes={resumes.data ?? []}
      submitLabel={existing ? 'Save changes' : 'Add application'}
      onSubmit={handleSubmit}
      onCancel={onClose}
    />
  );
}

export function ApplicationFormModal({ open, application, defaults, onClose, onSaved }: ApplicationFormModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={application ? 'Edit application' : 'Add application'}
      description={application ? `${application.jobTitle} at ${application.company.name}` : 'Track a job you applied to or want to apply to.'}
    >
      <FormBody application={application} defaults={defaults} onClose={onClose} onSaved={onSaved} />
    </Modal>
  );
}
