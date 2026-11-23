// Shapes of JSON responses returned by the Express API.
// Keep in sync with server/src/types/api.ts.

export interface ApiErrorResponse {
  error: {
    message: string;
  };
}

export interface HealthResponse {
  status: 'ok';
  service: string;
  environment: string;
  uptimeSeconds: number;
  timestamp: string;
}
