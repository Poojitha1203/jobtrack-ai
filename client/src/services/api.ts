
import { supabase } from '../lib/supabase.ts';
import type { ApiErrorResponse, HealthResponse } from '../types/api.ts';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

/** Error thrown for failed API calls. `details` holds per-field validation messages. */
export class ApiError extends Error {
  readonly status: number;
  readonly details?: Record<string, string[]>;
  /** e.g. "PLAN_LIMIT" when a Free plan limit was hit. */
  readonly code?: string;

  constructor(status: number, message: string, details?: Record<string, string[]>, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.code = code;
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  // getSession() returns the current (auto-refreshed) session from memory/localStorage.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) headers.set('Authorization', `Bearer ${session.access_token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api${path}`, { ...options, headers });
  } catch {
    throw new ApiError(0, 'Could not reach the server. Is the API running?');
  }

  // Some responses (or proxy errors) may not be JSON, so parse defensively.
  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const body = data as ApiErrorResponse | null;
    throw new ApiError(
      response.status,
      body?.error?.message ?? `Request failed with status ${response.status}`,
      body?.error?.details,
      body?.error?.code,
    );
  }

  return data as T;
}

export const getApiHealth = () => apiRequest<HealthResponse>('/health');
