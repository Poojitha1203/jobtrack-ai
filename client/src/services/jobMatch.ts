import { apiRequest } from './api.ts';
import type { JobMatchInput, JobMatchResult } from '../types/jobMatch.ts';

export const analyzeJobMatch = (input: JobMatchInput) =>
  apiRequest<JobMatchResult>('/job-match/analyze', { method: 'POST', body: JSON.stringify(input) });
