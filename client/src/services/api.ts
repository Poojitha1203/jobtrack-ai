// Small typed wrapper around fetch for talking to our Express API.
// Every feature (applications, interviews, ...) will call apiRequest<T>()
// instead of using fetch directly, so headers and error handling stay consistent.

import type { ApiErrorResponse, HealthResponse } from '../types/api.ts';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Some responses (or proxy errors) may not be JSON, so parse defensively.
  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (data as ApiErrorResponse | null)?.error?.message ??
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

export const getApiHealth = () => apiRequest<HealthResponse>('/health');
