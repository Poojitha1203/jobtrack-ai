import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router';
import { Loader2 } from 'lucide-react';
import { Modal, ModalFooter } from '../ui/Modal.tsx';
import { TextField } from '../ui/TextField.tsx';
import { SelectField } from '../ui/SelectField.tsx';
import { TextAreaField } from '../ui/TextAreaField.tsx';
import { Button } from '../ui/Button.tsx';
import { Alert } from '../ui/Alert.tsx';
import { useAsyncData } from '../../hooks/useAsyncData.ts';
import { ApiError } from '../../services/api.ts';
import { listAllApplications, updateApplication } from '../../services/applications.ts';
import { createInterview, updateInterview } from '../../services/interviews.ts';
import { appliedDateForStatus } from '../../lib/applicationForm.ts';
import {
  changedInterviewFields,
  toInterviewFormValues,
  toInterviewInput,
  validateInterviewForm,
  type InterviewFormErrors,
  type InterviewFormValues,
} from '../../lib/interviewForm.ts';
import {
  DURATION_OPTIONS,
  INTERVIEW_RESULT_META,
  INTERVIEW_TYPE_META,
  ROUND_SUGGESTIONS,
} from '../../lib/interviewOptions.ts';
import { INTERVIEW_RESULTS, INTERVIEW_TYPES, type Interview } from '../../types/interview.ts';
import type { ApplicationStatus } from '../../types/application.ts';

const EARLY_STAGES: ApplicationStatus[] = ['wishlist', 'applied', 'assessment'];

interface InterviewFormModalProps {
  open: boolean;
  interview?: Interview;
  /** Pre-filled values for a new interview, e.g. { applicationId } or { date }. */
  defaults?: Partial<InterviewFormValues>;
  onClose: () => void;
  onSaved: (interview: Interview, mode: 'created' | 'updated') => void;
}

function InterviewForm({ interview, defaults, onClose, onSaved }: Omit<InterviewFormModalProps, 'open'>) {
  const applications = useAsyncData(listAllApplications, 'interview-form-applications');
  const [initial] = useState(() => toInterviewFormValues(interview, defaults));
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<InterviewFormErrors>({});
  const [moveToInterviewStage, setMoveToInterviewStage] = useState(true);
  const [saving, setSaving] = useState(false);

  const bind = (key: keyof InterviewFormValues) => ({
    value: values[key],
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setValues((prev) => ({ ...prev, [key]: e.target.value })),
    error: errors[key],
  });

  const options = [...(applications.data ?? [])].sort(
    (a, b) => a.company.name.localeCompare(b.company.name) || a.jobTitle.localeCompare(b.jobTitle),
  );
  const selected = options.find((a) => a.id === values.applicationId);
  const canMoveStage = !interview && selected && EARLY_STAGES.includes(selected.status);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateInterviewForm(values);
    setErrors(validation);
    if (Object.values(validation).some(Boolean)) return;

    setSaving(true);
    try {
      if (interview) {
        const changes = changedInterviewFields(toInterviewInput(values), toInterviewInput(initial));
        if (Object.keys(changes).length === 0) {
          onClose();
          return;
        }
        onSaved(await updateInterview(interview.id, changes), 'updated');
        return;
      }
      const created = await createInterview(toInterviewInput(values));
      if (canMoveStage && moveToInterviewStage && selected) {
        const appliedAt = appliedDateForStatus('interview', selected.appliedAt);
        // Not critical: the interview is already saved even if this status update fails.
        await updateApplication(selected.id, appliedAt !== selected.appliedAt ? { status: 'interview', appliedAt } : { status: 'interview' }).catch(
          () => undefined,
        );
      }
      onSaved(created, 'created');
    } catch (error) {
      setSaving(false);
      if (error instanceof ApiError && error.details) {
        const fieldErrors: InterviewFormErrors = Object.fromEntries(
          Object.entries(error.details).map(([k, v]) => [k === 'scheduledAt' ? 'date' : k, v[0]]),
        );
        setErrors(fieldErrors);
      } else {
        setErrors({ _form: error instanceof Error ? error.message : 'Could not save the interview' });
      }
    }
  };

  if (!applications.data && !applications.error) {
    return (
      <div className="flex justify-center p-12" role="status">
        <Loader2 className="size-6 animate-spin text-brand-600" aria-label="Loading applications" />
      </div>
    );
  }

  if (applications.data?.length === 0) {
    return (
      <div className="space-y-4 p-6 text-sm text-slate-600">
        <p>Interviews belong to an application. Add the job first, then schedule its interviews.</p>
        <Link to="/applications?new=1" className="font-medium text-brand-600 hover:text-brand-700" onClick={onClose}>
          Add an application →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-5 px-6 py-5">
        {errors._form && <Alert tone="error">{errors._form}</Alert>}
        {applications.error && <Alert tone="error">{applications.error.message}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Application *" className="sm:col-span-2" {...bind('applicationId')}>
            <option value="">Choose a job…</option>
            {options.map((app) => (
              <option key={app.id} value={app.id}>
                {app.company.name} — {app.jobTitle}
              </option>
            ))}
          </SelectField>
          {canMoveStage && (
            <label className="flex items-start gap-2 text-sm text-slate-600 sm:col-span-2">
              <input
                type="checkbox"
                checked={moveToInterviewStage}
                onChange={(e) => setMoveToInterviewStage(e.target.checked)}
                className="mt-0.5 size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
              />
              Also move this application to the <strong className="font-medium text-slate-800">Interview</strong> stage
            </label>
          )}
          <TextField label="Round *" list="round-options" placeholder="e.g. Technical round 1" maxLength={100} {...bind('round')} />
          <datalist id="round-options">
            {ROUND_SUGGESTIONS.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
          <SelectField label="Type" {...bind('interviewType')}>
            {INTERVIEW_TYPES.map((t) => (
              <option key={t} value={t}>{INTERVIEW_TYPE_META[t].label}</option>
            ))}
          </SelectField>
          <TextField label="Date *" type="date" {...bind('date')} />
          <div className="grid grid-cols-2 gap-4">
            <TextField label="Time *" type="time" {...bind('time')} />
            <SelectField label="Duration" {...bind('durationMinutes')}>
              <option value="">—</option>
              {DURATION_OPTIONS.map((d) => (
                <option key={d} value={d}>{d < 60 ? `${d} min` : `${d / 60} h`}</option>
              ))}
            </SelectField>
          </div>
          <TextField
            label="Meeting link"
            type="url"
            placeholder="https://meet.google.com/…"
            className="sm:col-span-2"
            {...bind('meetingLink')}
          />
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-5">
          <TextAreaField
            label="Preparation notes"
            rows={4}
            maxLength={5000}
            placeholder="Topics to revise, questions to ask, people you'll meet…"
            {...bind('preparationNotes')}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <SelectField label="Result" {...bind('result')}>
              {INTERVIEW_RESULTS.map((r) => (
                <option key={r} value={r}>{INTERVIEW_RESULT_META[r].label}</option>
              ))}
            </SelectField>
            <TextAreaField label="Feedback" rows={2} maxLength={5000} className="sm:col-span-2" {...bind('feedback')} />
          </div>
        </div>
      </div>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {interview ? 'Save changes' : 'Schedule interview'}
        </Button>
      </ModalFooter>
    </form>
  );
}

export function InterviewFormModal({ open, interview, defaults, onClose, onSaved }: InterviewFormModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={interview ? 'Edit interview' : 'Schedule interview'}
      description={interview ? `${interview.application.company.name} — ${interview.round}` : undefined}
    >
      <InterviewForm interview={interview} defaults={defaults} onClose={onClose} onSaved={onSaved} />
    </Modal>
  );
}
