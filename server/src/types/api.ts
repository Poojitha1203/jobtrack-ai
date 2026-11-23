// Shapes of JSON responses sent by the API.
// The client keeps a matching copy in client/src/types/api.ts.

export interface ApiErrorResponse {
  error: {
    message: string;
    /** Field-level validation messages, e.g. { fullName: ['Name is required'] } */
    details?: Record<string, string[]>;
  };
}

export interface HealthResponse {
  status: 'ok';
  service: string;
  environment: string;
  uptimeSeconds: number;
  timestamp: string;
}

export type UserRole = 'user' | 'admin';

export interface ProfileResponse {
  id: string;
  email: string;
  fullName: string;
  headline: string | null;
  location: string | null;
  weeklyGoal: number;
  role: UserRole;
  createdAt: string;
}
