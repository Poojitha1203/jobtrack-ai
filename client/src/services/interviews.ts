import { apiRequest } from './api.ts';
import type { Interview, InterviewInput, InterviewQuery } from '../types/interview.ts';

export function listInterviews(query: InterviewQuery = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return apiRequest<{ items: Interview[] }>(`/interviews?${params}`).then((res) => res.items);
}

export const createInterview = (input: InterviewInput) =>
  apiRequest<Interview>('/interviews', { method: 'POST', body: JSON.stringify(input) });

export const updateInterview = (id: string, changes: Partial<InterviewInput>) =>
  apiRequest<Interview>(`/interviews/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(changes) });

export const deleteInterview = (id: string) =>
  apiRequest<void>(`/interviews/${encodeURIComponent(id)}`, { method: 'DELETE' });
