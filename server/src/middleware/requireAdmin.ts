import type { RequestHandler } from 'express';
import { getAuth } from './requireAuth.js';
import { HttpError } from '../utils/HttpError.js';

/**
 * Use after requireAuth. Reads the role from the database on every request (not from the
 * token), so removing someone's admin role takes effect immediately.
 */
export const requireAdmin: RequestHandler = async (req, _res, next) => {
  const { supabase, userId } = getAuth(req);
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle<{ role: string }>();

  if (error) throw new Error(`Failed to check permissions: ${error.message}`);
  if (data?.role !== 'admin') throw new HttpError(403, 'Admin access required');
  next();
};
