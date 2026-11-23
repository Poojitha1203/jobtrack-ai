import type { Request, Response } from 'express';
import type { ApiErrorResponse } from '../types/api.js';

// Runs when no route matched the request.
export const notFound = (req: Request, res: Response<ApiErrorResponse>): void => {
  res.status(404).json({
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
  });
};
