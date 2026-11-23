import type { NextFunction, Request, Response } from 'express';
import { isProduction } from '../config/env.js';
import { HttpError } from '../utils/HttpError.js';
import type { ApiErrorResponse } from '../types/api.js';

// Reads an HTTP status from any thrown value (HttpError, body-parser errors, etc.).
const getStatus = (err: unknown): number => {
  if (typeof err === 'object' && err !== null) {
    const { status, statusCode } = err as { status?: unknown; statusCode?: unknown };
    const candidate = status ?? statusCode;
    if (typeof candidate === 'number' && candidate >= 400 && candidate < 600) return candidate;
  }
  return 500;
};

// Express recognises an error handler by its 4 parameters, so `_next` must stay
// even though it is unused.
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response<ApiErrorResponse>,
  _next: NextFunction,
): void => {
  const status = getStatus(err);
  const message = err instanceof Error ? err.message : 'Unexpected error';

  // Expected client errors (401, 404, validation) don't need a stack trace in the logs.
  if (status >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  } else {
    console.warn(`[${req.method} ${req.originalUrl}] ${status} ${message}`);
  }

  res.status(status).json({
    error: {
      // Never leak internal error details (stack traces, SQL, etc.) in production.
      message: status >= 500 && isProduction ? 'Internal server error' : message,
      ...(err instanceof HttpError && err.details ? { details: err.details } : {}),
    },
  });
};
