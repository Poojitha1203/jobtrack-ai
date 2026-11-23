import type { Request, RequestHandler } from 'express';
import { createUserClient } from '../lib/supabase.js';
import { HttpError } from '../utils/HttpError.js';

/**
 * Protects a route: the request must carry a valid Supabase access token
 * in the header `Authorization: Bearer <token>`.
 *
 * On success it sets `req.auth` with the user's id, email and a Supabase
 * client that acts as that user (so RLS applies to every query).
 */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new HttpError(401, 'Authentication required');
  }

  const supabase = createUserClient(token);
  // Asks Supabase Auth to validate the token (signature, expiry, and that the user still exists).
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new HttpError(401, 'Your session is invalid or has expired. Please log in again.');
  }

  req.auth = { userId: data.user.id, email: data.user.email ?? '', supabase };
  next();
};

/** Reads `req.auth` in a controller. Throws 401 if requireAuth didn't run. */
export function getAuth(req: Request) {
  if (!req.auth) throw new HttpError(401, 'Authentication required');
  return req.auth;
}
