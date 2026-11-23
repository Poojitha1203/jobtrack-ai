import type { Reminder, ReminderInput, ReminderType } from '../types/reminder.ts';
import { addDays, startOfDay } from './date.ts';
import { toDateOnly } from './format.ts';
import { toScheduledAt } from './interviewForm.ts';

export interface ReminderFormValues {
  type: ReminderType;
  title: string;
  date: string;
  time: string;
  applicationId: string;
  interviewId: string;
  notes: string;
}

export type ReminderFormErrors = Partial<Record<keyof ReminderFormValues | '_form', string>>;

const pad = (n: number) => String(n).padStart(2, '0');

export function toReminderFormValues(reminder?: Reminder, defaults: Partial<ReminderFormValues> = {}): ReminderFormValues {
  const when = reminder ? new Date(reminder.remindAt) : null;
  return {
    type: reminder?.type ?? 'follow_up',
    title: reminder?.title ?? '',
    date: when ? toDateOnly(when) : toDateOnly(addDays(new Date(), 1)),
    time: when ? `${pad(when.getHours())}:${pad(when.getMinutes())}` : '10:00',
    applicationId: reminder?.applicationId ?? '',
    interviewId: reminder?.interviewId ?? '',
    notes: reminder?.notes ?? '',
    ...(reminder ? {} : defaults),
  };
}

export function toReminderInput(values: ReminderFormValues): ReminderInput {
  return {
    type: values.type,
    title: values.title.trim(),
    notes: values.notes.trim() || null,
    remindAt: toScheduledAt(values.date, values.time),
    applicationId: values.applicationId || null,
    interviewId: values.type === 'interview' ? values.interviewId || null : null,
  };
}

export function changedReminderFields(next: ReminderInput, previous: ReminderInput): Partial<ReminderInput> {
  return Object.fromEntries(
    (Object.keys(next) as (keyof ReminderInput)[]).filter((k) => next[k] !== previous[k]).map((k) => [k, next[k]]),
  );
}

export function validateReminderForm(values: ReminderFormValues): ReminderFormErrors {
  const errors: ReminderFormErrors = {};
  if (!values.title.trim()) errors.title = 'Title is required';
  if (!values.date) errors.date = 'Date is required';
  if (!values.time) errors.time = 'Time is required';
  return errors;
}

/** Defaults for "Remind me to follow up" from an application page: one week from today at 10:00. */
export const followUpDefaults = (applicationId: string, companyName: string): Partial<ReminderFormValues> => ({
  type: 'follow_up',
  applicationId,
  title: `Follow up with ${companyName}`,
  date: toDateOnly(addDays(new Date(), 7)),
  time: '10:00',
});

export interface ReminderGroups {
  overdue: Reminder[];
  today: Reminder[];
  upcoming: Reminder[];
}

export function groupOpenReminders(reminders: Reminder[], now: number): ReminderGroups {
  const endOfToday = addDays(startOfDay(new Date(now)), 1).getTime();
  const groups: ReminderGroups = { overdue: [], today: [], upcoming: [] };
  for (const reminder of reminders) {
    const at = new Date(reminder.remindAt).getTime();
    if (at <= now) groups.overdue.push(reminder);
    else if (at < endOfToday) groups.today.push(reminder);
    else groups.upcoming.push(reminder);
  }
  return groups;
}
