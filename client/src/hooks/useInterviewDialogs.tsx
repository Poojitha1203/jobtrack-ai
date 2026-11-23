import { useState } from 'react';
import { InterviewFormModal } from '../components/interviews/InterviewFormModal.tsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.tsx';
import { deleteInterview } from '../services/interviews.ts';
import { useToast } from './useToast.ts';
import type { InterviewFormValues } from '../lib/interviewForm.ts';
import type { Interview } from '../types/interview.ts';

type FormState = { open: false } | { open: true; interview?: Interview; defaults?: Partial<InterviewFormValues> };

/** Shared create / edit / delete dialogs for interviews. Render `dialogs` once in the page. */
export function useInterviewDialogs(onChanged: () => void) {
  const showToast = useToast();
  const [form, setForm] = useState<FormState>({ open: false });
  const [toDelete, setToDelete] = useState<Interview | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteInterview(toDelete.id);
      showToast('Interview deleted');
      setToDelete(null);
      onChanged();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not delete the interview', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const dialogs = (
    <>
      <InterviewFormModal
        open={form.open}
        interview={form.open ? form.interview : undefined}
        defaults={form.open ? form.defaults : undefined}
        onClose={() => setForm({ open: false })}
        onSaved={(saved, mode) => {
          setForm({ open: false });
          showToast(mode === 'created' ? `Interview with ${saved.application.company.name} scheduled` : 'Interview updated');
          onChanged();
        }}
      />
      <ConfirmDialog
        open={toDelete !== null}
        title="Delete interview?"
        message={
          toDelete && (
            <>
              <strong className="text-slate-900">{toDelete.round}</strong> with {toDelete.application.company.name} will be
              permanently deleted.
            </>
          )
        }
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />
    </>
  );

  return {
    openCreate: (defaults?: Partial<InterviewFormValues>) => setForm({ open: true, defaults }),
    openEdit: (interview: Interview) => setForm({ open: true, interview }),
    openDelete: setToDelete,
    dialogs,
  };
}
