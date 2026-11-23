// Shapes of JSON responses sent by the API.
// The client keeps a matching copy in client/src/types/api.ts.

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
