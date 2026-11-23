// An Error that carries an HTTP status code (and optional field-level details).
// Throw it anywhere (controllers, middleware) and the central errorHandler
// turns it into a JSON response with the right status.
export class HttpError extends Error {
  readonly status: number;
  readonly details?: Record<string, string[]>;

  constructor(status: number, message: string, details?: Record<string, string[]>) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}
