import { apiRequest } from './api.ts';
import type { Reminder, ReminderInput, ReminderQuery } from '../types/reminder.ts';

// A tiny browser event so the notification bell refreshes whenever reminders change anywhere.
const CHANGED_EVENT = 'jobtrack:reminders-changed';

export const onRemindersChanged = (callback: () => void) => {
  window.addEventListener(CHANGED_EVENT, callback);
  return () => window.removeEventListener(CHANGED_EVENT, callback);
};

const notifyChanged = <T>(result: T) => {
  window.dispatchEvent(new Event(CHANGED_EVENT));
  return result;
};

export function listReminders(query: ReminderQuery = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return apiRequest<{ items: Reminder[] }>(`/reminders?${params}`).then((res) => res.items);
}

export const createReminder = (input: ReminderInput) =>
  apiRequest<Reminder>('/reminders', { method: 'POST', body: JSON.stringify(input) }).then(notifyChanged);

export const updateReminder = (id: string, changes: Partial<ReminderInput & { isCompleted: boolean }>) =>
  apiRequest<Reminder>(`/reminders/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  }).then(notifyChanged);

export const deleteReminder = (id: string) =>
  apiRequest<void>(`/reminders/${encodeURIComponent(id)}`, { method: 'DELETE' }).then(notifyChanged);
