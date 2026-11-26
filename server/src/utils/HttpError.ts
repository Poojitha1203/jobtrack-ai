
export class HttpError extends Error {
  readonly status: number;
  readonly details?: Record<string, string[]>;
  /** Machine-readable reason, e.g. "PLAN_LIMIT", so the client can react (show an upgrade prompt). */
  readonly code?: string;

  constructor(status: number, message: string, details?: Record<string, string[]>, code?: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
    this.code = code;
  }
}
