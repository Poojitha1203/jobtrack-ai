import type { RequestHandler } from 'express';
import { z } from 'zod';
import { HttpError } from '../utils/HttpError.js';

/**
 * Validates (and cleans) req.body with a zod schema before the controller runs.
 * Invalid input → 400 with per-field messages. Valid input replaces req.body,
 * so controllers receive trimmed, correctly-typed data with unknown fields removed.
 */
export const validateBody =
  (schema: z.ZodType): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      const { fieldErrors, formErrors } = z.flattenError(result.error);
      const details = { ...(fieldErrors as Record<string, string[]>) };
      if (formErrors.length > 0) details._form = formErrors;
      throw new HttpError(400, 'Please check the highlighted fields.', details);
    }
    req.body = result.data;
    next();
  };
