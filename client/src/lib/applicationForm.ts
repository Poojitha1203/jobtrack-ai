import type { Application, ApplicationInput, ApplicationStatus, JobType, WorkMode } from '../types/application.ts';
import { todayDateOnly } from './format.ts';

// Form inputs hold strings; these helpers convert to and from the API shape.

export interface ApplicationFormValues {
  jobTitle: string;
  companyName: string;
  location: string;
  jobType: JobType | '';
  workMode: WorkMode | '';
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  jobDescription: string;
  jobUrl: string;
  source: string;
  status: ApplicationStatus;
  appliedAt: string;
  notes: string;
}

export type ApplicationFormErrors = Partial<Record<keyof ApplicationFormValues | '_form', string>>;

export function toFormValues(app?: Application): ApplicationFormValues {
  return {
    jobTitle: app?.jobTitle ?? '',
    companyName: app?.company.name ?? '',
    location: app?.location ?? '',
    jobType: app?.jobType ?? '',
    workMode: app?.workMode ?? '',
    salaryMin: app?.salaryMin?.toString() ?? '',
    salaryMax: app?.salaryMax?.toString() ?? '',
    salaryCurrency: app?.salaryCurrency ?? 'INR',
    jobDescription: app?.jobDescription ?? '',
    jobUrl: app?.jobUrl ?? '',
    source: app?.source ?? '',
    status: app?.status ?? 'applied',
    appliedAt: app ? (app.appliedAt ?? '') : todayDateOnly(),
    notes: app?.notes ?? '',
  };
}

const textOrNull = (value: string) => value.trim() || null;
const numberOrNull = (value: string) => (value.trim() === '' ? null : Number(value));

export function toApplicationInput(values: ApplicationFormValues): ApplicationInput {
  return {
    jobTitle: values.jobTitle.trim(),
    companyName: values.companyName.trim(),
    location: textOrNull(values.location),
    jobType: values.jobType || null,
    workMode: values.workMode || null,
    salaryMin: numberOrNull(values.salaryMin),
    salaryMax: numberOrNull(values.salaryMax),
    salaryCurrency: values.salaryCurrency,
    jobDescription: textOrNull(values.jobDescription),
    jobUrl: textOrNull(values.jobUrl),
    source: textOrNull(values.source),
    status: values.status,
    appliedAt: values.appliedAt || null,
    notes: textOrNull(values.notes),
  };
}

/** Only the fields that changed — so an edit never overwrites data it didn't touch. */
export function changedFields(next: ApplicationInput, previous: ApplicationInput): Partial<ApplicationInput> {
  const changes: Partial<ApplicationInput> = {};
  for (const key of Object.keys(next) as (keyof ApplicationInput)[]) {
    if (next[key] !== previous[key]) Object.assign(changes, { [key]: next[key] });
  }
  return changes;
}

function salaryError(value: string): string | undefined {
  if (value.trim() === '') return undefined;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) return 'Enter a whole number, 0 or more';
  if (n > 1_000_000_000) return 'That number is too large';
  return undefined;
}

function urlError(value: string): string | undefined {
  if (!value.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? undefined : 'Link must start with http:// or https://';
  } catch {
    return 'Enter a full link, e.g. https://company.com/jobs/123';
  }
}

export function validateApplicationForm(values: ApplicationFormValues): ApplicationFormErrors {
  const errors: ApplicationFormErrors = {
    jobTitle: values.jobTitle.trim() ? undefined : 'Job title is required',
    companyName: values.companyName.trim() ? undefined : 'Company is required',
    salaryMin: salaryError(values.salaryMin),
    salaryMax: salaryError(values.salaryMax),
    jobUrl: urlError(values.jobUrl),
  };
  const min = numberOrNull(values.salaryMin);
  const max = numberOrNull(values.salaryMax);
  if (!errors.salaryMin && !errors.salaryMax && min != null && max != null && max < min) {
    errors.salaryMax = 'Must be greater than or equal to the minimum';
  }
  return errors;
}

/** Moving an application out of the wishlist means it was sent — default the date to today. */
export function appliedDateForStatus(status: ApplicationStatus, currentAppliedAt: string | null): string | null {
  if (status !== 'wishlist' && !currentAppliedAt) return todayDateOnly();
  return currentAppliedAt;
}
