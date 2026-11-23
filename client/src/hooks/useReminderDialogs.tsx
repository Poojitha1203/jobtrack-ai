import { useState } from 'react';
import { ReminderFormModal } from '../components/reminders/ReminderFormModal.tsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.tsx';
import { deleteReminder, updateReminder } from '../services/reminders.ts';
import { useToast } from './useToast.ts';
import type { ReminderFormValues } from '../lib/reminderForm.ts';
import type { Reminder } from '../types/reminder.ts';

type FormState = { open: false } | { open: true; reminder?: Reminder; defaults?: Partial<ReminderFormValues> };

/** Shared create / edit / complete / delete actions for reminders. Render `dialogs` once in the page. */
export function useReminderDialogs(onChanged: () => void) {
  const showToast = useToast();
  const [form, setForm] = useState<FormState>({ open: false });
  const [toDelete, setToDelete] = useState<Reminder | null>(null);
  const [deleting, setDeleting] = useState(false);

  const toggleComplete = async (reminder: Reminder) => {
    try {
      await updateReminder(reminder.id, { isCompleted: !reminder.isCompleted });
      showToast(reminder.isCompleted ? 'Reminder reopened' : 'Reminder marked as done');
      onChanged();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not update the reminder', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteReminder(toDelete.id);
      showToast('Reminder deleted');
      setToDelete(null);
      onChanged();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not delete the reminder', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const dialogs = (
    <>
      <ReminderFormModal
        open={form.open}
        reminder={form.open ? form.reminder : undefined}
        defaults={form.open ? form.defaults : undefined}
        onClose={() => setForm({ open: false })}
        onSaved={(_saved, mode) => {
          setForm({ open: false });
          showToast(mode === 'created' ? 'Reminder added' : 'Reminder updated');
          onChanged();
        }}
      />
      <ConfirmDialog
        open={toDelete !== null}
        title="Delete reminder?"
        message={toDelete && <>“{toDelete.title}” will be permanently deleted.</>}
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />
    </>
  );

  return {
    openCreate: (defaults?: Partial<ReminderFormValues>) => setForm({ open: true, defaults }),
    openEdit: (reminder: Reminder) => setForm({ open: true, reminder }),
    openDelete: setToDelete,
    toggleComplete: (reminder: Reminder) => void toggleComplete(reminder),
    dialogs,
  };
}
