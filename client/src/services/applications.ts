import { apiRequest } from './api.ts';
import type { PaginatedResponse } from '../types/api.ts';
import type { Application, ApplicationInput, ApplicationQuery, ApplicationStatus } from '../types/application.ts';

function toSearchParams(query: Partial<ApplicationQuery>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  return params.toString();
}

export const listApplications = (query: ApplicationQuery) =>
  apiRequest<PaginatedResponse<Application>>(`/applications?${toSearchParams(query)}`);

export const listAllApplications = () =>
  apiRequest<{ items: Application[] }>('/applications/summary').then((res) => res.items);

export const getApplication = (id: string) =>
  apiRequest<Application>(`/applications/${encodeURIComponent(id)}`);

export const createApplication = (input: ApplicationInput) =>
  apiRequest<Application>('/applications', { method: 'POST', body: JSON.stringify(input) });

export const updateApplication = (id: string, changes: Partial<ApplicationInput>) =>
  apiRequest<Application>(`/applications/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });

export const deleteApplication = (id: string) =>
  apiRequest<void>(`/applications/${encodeURIComponent(id)}`, { method: 'DELETE' });

export interface MoveApplicationInput {
  status: ApplicationStatus;
  /** Every card id in the destination column, in their new order. */
  orderedIds: string[];
  appliedAt?: string | null;
}

export const moveApplication = (id: string, input: MoveApplicationInput) =>
  apiRequest<void>(`/applications/${encodeURIComponent(id)}/move`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
