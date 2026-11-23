import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Modal, ModalFooter } from '../ui/Modal.tsx';
import { TextField } from '../ui/TextField.tsx';
import { SelectField } from '../ui/SelectField.tsx';
import { TextAreaField } from '../ui/TextAreaField.tsx';
import { Button } from '../ui/Button.tsx';
import { Alert } from '../ui/Alert.tsx';
import { useAsyncData } from '../../hooks/useAsyncData.ts';
import { ApiError } from '../../services/api.ts';
import { listAllApplications } from '../../services/applications.ts';
import { listInterviews } from '../../services/interviews.ts';
import { createReminder, updateReminder } from '../../services/reminders.ts';
import { formatDateTime } from '../../lib/format.ts';
import { REMINDER_TYPE_META } from '../../lib/reminderOptions.ts';
import {
  changedReminderFields,
  toReminderFormValues,
  toReminderInput,
  validateReminderForm,
  type ReminderFormErrors,
  type ReminderFormValues,
} from '../../lib/reminderForm.ts';
import { REMINDER_TYPES, type Reminder } from '../../types/reminder.ts';

interface ReminderFormModalProps {
  open: boolean;
  reminder?: Reminder;
  defaults?: Partial<ReminderFormValues>;
  onClose: () => void;
  onSaved: (reminder: Reminder, mode: 'created' | 'updated') => void;
}

function ReminderForm({ reminder, defaults, onClose, onSaved }: Omit<ReminderFormModalProps, 'open'>) {
  const applications = useAsyncData(listAllApplications, 'reminder-form-applications');
  const [interviewsFrom] = useState(() => new Date().toISOString());
  const interviews = useAsyncData(() => listInterviews({ from: interviewsFrom, order: 'asc' }), 'reminder-form-interviews');
  const [initial] = useState(() => toReminderFormValues(reminder, defaults));
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<ReminderFormErrors>({});
  const [saving, setSaving] = useState(false);

  const bind = (key: keyof ReminderFormValues) => ({
    value: values[key],
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setValues((prev) => ({ ...prev, [key]: e.target.value })),
    error: errors[key],
  });

  const appOptions = [...(applications.data ?? [])].sort((a, b) => a.company.name.localeCompare(b.company.name));
  const interviewOptions = (interviews.data ?? []).filter(
    (i) => !values.applicationId || i.applicationId === values.applicationId,
  );

  const handleApplicationChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const app = appOptions.find((a) => a.id === e.target.value);
    setValues((prev) => ({
      ...prev,
      applicationId: e.target.value,
      interviewId: '',
      title: !prev.title.trim() && app && prev.type === 'follow_up' ? `Follow up with ${app.company.name}` : prev.title,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateReminderForm(values);
    setErrors(validation);
    if (Object.values(validation).some(Boolean)) return;

    setSaving(true);
    try {
      if (reminder) {
        const changes = changedReminderFields(toReminderInput(values), toReminderInput(initial));
        if (Object.keys(changes).length === 0) {
          onClose();
          return;
        }
        onSaved(await updateReminder(reminder.id, changes), 'updated');
      } else {
        onSaved(await createReminder(toReminderInput(values)), 'created');
      }
    } catch (error) {
      setSaving(false);
      if (error instanceof ApiError && error.details) {
        setErrors(
          Object.fromEntries(Object.entries(error.details).map(([k, v]) => [k === 'remindAt' ? 'date' : k, v[0]])),
        );
      } else {
        setErrors({ _form: error instanceof Error ? error.message : 'Could not save the reminder' });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-4 px-6 py-5">
        {errors._form && <Alert tone="error">{errors._form}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Type" {...bind('type')}>
            {REMINDER_TYPES.map((t) => (
              <option key={t} value={t}>{REMINDER_TYPE_META[t].label}</option>
            ))}
          </SelectField>
          <SelectField label="Related application" value={values.applicationId} onChange={handleApplicationChange} error={errors.applicationId}>
            <option value="">None</option>
            {appOptions.map((app) => (
              <option key={app.id} value={app.id}>{app.company.name} — {app.jobTitle}</option>
            ))}
          </SelectField>
          <TextField label="Title *" maxLength={150} placeholder="e.g. Email the recruiter" autoFocus className="sm:col-span-2" {...bind('title')} />
          <TextField label="Date *" type="date" {...bind('date')} />
          <TextField label="Time *" type="time" {...bind('time')} />
          {values.type === 'interview' && (
            <SelectField label="Interview" className="sm:col-span-2" {...bind('interviewId')}>
              <option value="">Not linked</option>
              {interviewOptions.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.application.company.name} — {i.round} ({formatDateTime(i.scheduledAt)})
                </option>
              ))}
            </SelectField>
          )}
          <TextAreaField label="Notes" rows={3} maxLength={2000} className="sm:col-span-2" {...bind('notes')} />
        </div>
      </div>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {reminder ? 'Save changes' : 'Add reminder'}
        </Button>
      </ModalFooter>
    </form>
  );
}

export function ReminderFormModal({ open, reminder, defaults, onClose, onSaved }: ReminderFormModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={reminder ? 'Edit reminder' : 'Add reminder'}>
      <ReminderForm reminder={reminder} defaults={defaults} onClose={onClose} onSaved={onSaved} />
    </Modal>
  );
}
