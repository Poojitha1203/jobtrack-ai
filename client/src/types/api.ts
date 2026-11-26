
export interface ApiErrorResponse {
  error: {
    message: string;
    /** Field-level validation messages, e.g. { fullName: ['Name is required'] } */
    details?: Record<string, string[]>;
    code?: string;
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

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  headline: string | null;
  location: string | null;
  weeklyGoal: number;
  role: UserRole;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type UpdateProfileInput = Partial<
  Pick<Profile, 'fullName' | 'headline' | 'location' | 'weeklyGoal'>
>;
