import { useState, type ChangeEvent, type FormEvent } from 'react';
import { TextField } from '../ui/TextField.tsx';
import { SelectField } from '../ui/SelectField.tsx';
import { TextAreaField } from '../ui/TextAreaField.tsx';
import { Button } from '../ui/Button.tsx';
import { Alert } from '../ui/Alert.tsx';
import { ModalFooter } from '../ui/Modal.tsx';
import { STATUS_META } from '../../lib/status.ts';
import {
  CURRENCIES,
  JOB_TYPE_LABELS,
  SOURCE_SUGGESTIONS,
  WORK_MODE_LABELS,
} from '../../lib/applicationOptions.ts';
import {
  validateApplicationForm,
  type ApplicationFormErrors,
  type ApplicationFormValues,
} from '../../lib/applicationForm.ts';
import { todayDateOnly } from '../../lib/format.ts';
import { APPLICATION_STATUSES, JOB_TYPES, WORK_MODES, type CompanySummary } from '../../types/application.ts';

interface ApplicationFormProps {
  initialValues: ApplicationFormValues;
  companies: CompanySummary[];
  submitLabel: string;
  onSubmit: (values: ApplicationFormValues) => Promise<ApplicationFormErrors | void>;
  onCancel: () => void;
}

export function ApplicationForm({ initialValues, companies, submitLabel, onSubmit, onCancel }: ApplicationFormProps) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<ApplicationFormErrors>({});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ApplicationFormValues>(key: K, value: ApplicationFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const bind = (key: keyof ApplicationFormValues) => ({
    value: values[key],
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      set(key, e.target.value as never),
    error: errors[key],
  });

  const handleStatusChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value as ApplicationFormValues['status'];
    setValues((prev) => ({
      ...prev,
      status,
      appliedAt: status !== 'wishlist' && !prev.appliedAt ? todayDateOnly() : prev.appliedAt,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateApplicationForm(values);
    setErrors(validation);
    if (Object.values(validation).some(Boolean)) return;

    setSaving(true);
    const serverErrors = await onSubmit(values);
    setSaving(false);
    if (serverErrors) setErrors(serverErrors);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-6 px-6 py-5">
        {errors._form && <Alert tone="error">{errors._form}</Alert>}

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="sr-only">Role</legend>
          <TextField label="Job title *" maxLength={150} autoFocus {...bind('jobTitle')} />
          <TextField
            label="Company *"
            maxLength={150}
            list="company-options"
            autoComplete="off"
            hint="Pick an existing company or type a new one."
            {...bind('companyName')}
          />
          <datalist id="company-options">
            {companies.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
          <SelectField label="Status" value={values.status} onChange={handleStatusChange}>
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </SelectField>
          <TextField label="Date applied" type="date" max={todayDateOnly()} {...bind('appliedAt')} />
          <TextField label="Location" placeholder="e.g. Bengaluru" maxLength={150} {...bind('location')} />
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Work mode" {...bind('workMode')}>
              <option value="">—</option>
              {WORK_MODES.map((m) => (
                <option key={m} value={m}>
                  {WORK_MODE_LABELS[m]}
                </option>
              ))}
            </SelectField>
            <SelectField label="Job type" {...bind('jobType')}>
              <option value="">—</option>
              {JOB_TYPES.map((t) => (
                <option key={t} value={t}>
                  {JOB_TYPE_LABELS[t]}
                </option>
              ))}
            </SelectField>
          </div>
        </fieldset>

        <fieldset className="grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3">
          <legend className="sr-only">Salary and source</legend>
          <TextField label="Salary from" type="number" inputMode="numeric" min={0} step={1} {...bind('salaryMin')} />
          <TextField label="Salary to" type="number" inputMode="numeric" min={0} step={1} {...bind('salaryMax')} />
          <SelectField label="Currency" {...bind('salaryCurrency')}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectField>
          <TextField label="Source" list="source-options" placeholder="e.g. LinkedIn" maxLength={100} {...bind('source')} />
          <datalist id="source-options">
            {SOURCE_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <TextField
            label="Job posting URL"
            type="url"
            placeholder="https://"
            className="sm:col-span-2"
            {...bind('jobUrl')}
          />
        </fieldset>

        <fieldset className="space-y-4 border-t border-slate-100 pt-6">
          <legend className="sr-only">Description and notes</legend>
          <TextAreaField
            label="Job description"
            rows={6}
            maxLength={20000}
            hint="Paste it here — the Job Match analyzer will use it in Phase 7."
            {...bind('jobDescription')}
          />
          <TextAreaField label="Notes" rows={3} maxLength={5000} {...bind('notes')} />
        </fieldset>
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {submitLabel}
        </Button>
      </ModalFooter>
    </form>
  );
}
