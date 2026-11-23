export const INTERVIEW_TYPES = ['phone', 'video', 'onsite'] as const;
export const INTERVIEW_RESULTS = ['pending', 'passed', 'failed', 'cancelled'] as const;

export type InterviewType = (typeof INTERVIEW_TYPES)[number];
export type InterviewResult = (typeof INTERVIEW_RESULTS)[number];
