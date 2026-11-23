// An Error that carries an HTTP status code.
// Throw it anywhere (controllers, middleware) and the central errorHandler
// turns it into a JSON response with the right status.
export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}
