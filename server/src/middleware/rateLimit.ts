import type { Request, RequestHandler } from 'express';
import { HttpError } from '../utils/HttpError.js';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  /** Who is being counted. Defaults to the client IP. */
  keyBy?: (req: Request) => string;
  message?: string;
}

export const RATE_LIMITED = 'RATE_LIMITED';

/**
 * Fixed-window limiter kept in memory. Good enough for one server process; with several
 * instances each keeps its own counts, so the real limit is max × instances.
 */
export function rateLimit({
  windowMs,
  max,
  keyBy = (req) => req.ip ?? 'unknown',
  message = 'Too many requests. Please wait a moment and try again.',
}: RateLimitOptions): RequestHandler {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req, res, next) => {
    const now = Date.now();
    if (hits.size > 10_000) {
      for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
    }

    const key = keyBy(req);
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;

    const resetSeconds = Math.ceil((entry.resetAt - now) / 1000);
    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - entry.count)));
    res.setHeader('RateLimit-Reset', String(resetSeconds));

    if (entry.count > max) {
      res.setHeader('Retry-After', String(resetSeconds));
      throw new HttpError(429, message, undefined, RATE_LIMITED);
    }
    next();
  };
}

/** Counts per signed-in user (use after requireAuth), falling back to the IP. */
export const byUser = (req: Request) => req.auth?.userId ?? req.ip ?? 'unknown';
