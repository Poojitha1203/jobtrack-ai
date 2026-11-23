import type { Interview, InterviewInput, InterviewResult, InterviewType } from '../types/interview.ts';
import { toDateOnly } from './format.ts';

export interface InterviewFormValues {
  applicationId: string;
  round: string;
  interviewType: InterviewType;
  /** Local date, YYYY-MM-DD */
  date: string;
  /** Local time, HH:MM */
  time: string;
  durationMinutes: string;
  meetingLink: string;
  preparationNotes: string;
  feedback: string;
  result: InterviewResult;
}

export type InterviewFormErrors = Partial<Record<keyof InterviewFormValues | 'scheduledAt' | '_form', string>>;

const pad = (n: number) => String(n).padStart(2, '0');

export function toInterviewFormValues(interview?: Interview, defaults: Partial<InterviewFormValues> = {}): InterviewFormValues {
  const when = interview ? new Date(interview.scheduledAt) : null;
  return {
    applicationId: interview?.applicationId ?? '',
    round: interview?.round ?? '',
    interviewType: interview?.interviewType ?? 'video',
    date: when ? toDateOnly(when) : '',
    time: when ? `${pad(when.getHours())}:${pad(when.getMinutes())}` : '10:00',
    durationMinutes: interview?.durationMinutes?.toString() ?? (interview ? '' : '60'),
    meetingLink: interview?.meetingLink ?? '',
    preparationNotes: interview?.preparationNotes ?? '',
    feedback: interview?.feedback ?? '',
    result: interview?.result ?? 'pending',
    ...(interview ? {} : defaults),
  };
}

/** Local date + time from the form → an exact UTC moment the server can store. */
export const toScheduledAt = (date: string, time: string) => new Date(`${date}T${time}`).toISOString();

export function toInterviewInput(values: InterviewFormValues): InterviewInput {
  const orNull = (value: string) => value.trim() || null;
  return {
    applicationId: values.applicationId,
    round: values.round.trim(),
    interviewType: values.interviewType,
    scheduledAt: toScheduledAt(values.date, values.time),
    durationMinutes: values.durationMinutes ? Number(values.durationMinutes) : null,
    meetingLink: orNull(values.meetingLink),
    preparationNotes: orNull(values.preparationNotes),
    feedback: orNull(values.feedback),
    result: values.result,
  };
}

export function changedInterviewFields(next: InterviewInput, previous: InterviewInput): Partial<InterviewInput> {
  return Object.fromEntries(
    (Object.keys(next) as (keyof InterviewInput)[]).filter((k) => next[k] !== previous[k]).map((k) => [k, next[k]]),
  );
}

export function validateInterviewForm(values: InterviewFormValues): InterviewFormErrors {
  const errors: InterviewFormErrors = {};
  if (!values.applicationId) errors.applicationId = 'Choose an application';
  if (!values.round.trim()) errors.round = 'Round is required';
  if (!values.date) errors.date = 'Date is required';
  if (!values.time) errors.time = 'Time is required';
  if (values.date && values.time && Number.isNaN(new Date(`${values.date}T${values.time}`).getTime())) {
    errors.date = 'Enter a valid date';
  }
  if (values.meetingLink.trim()) {
    try {
      const url = new URL(values.meetingLink.trim());
      if (url.protocol !== 'http:' && url.protocol !== 'https:') errors.meetingLink = 'Link must start with https://';
    } catch {
      errors.meetingLink = 'Enter a full link, e.g. https://meet.google.com/abc-defg-hij';
    }
  }
  return errors;
}

export function interviewEndTime(interview: Pick<Interview, 'scheduledAt' | 'durationMinutes'>): Date | null {
  if (!interview.durationMinutes) return null;
  return new Date(new Date(interview.scheduledAt).getTime() + interview.durationMinutes * 60_000);
}
