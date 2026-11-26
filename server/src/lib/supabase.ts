import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/HttpError.js';

// Server-side clients never store sessions — each request brings its own token.
const SERVER_AUTH_OPTIONS = {
  persistSession: false,
  autoRefreshToken: false,
  detectSessionInUrl: false,
} as const;

/**
 * A Supabase client that makes database calls AS the signed-in user.
 * It uses the publishable key plus the user's access token, so Postgres
 * Row Level Security decides what the user may read or change.
 * This is the client to use for normal user requests.
 */
export function createUserClient(accessToken: string): SupabaseClient {
  return createClient(env.supabaseUrl, env.supabasePublishableKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: SERVER_AUTH_OPTIONS,
  });
}

let adminClient: SupabaseClient | null = null;

/**
 * Uses the SECRET key, which bypasses Row Level Security. Server-only, and only for
 * writes users must not make themselves (subscriptions, payments) — never for normal reads.
 */
export function getAdminClient(): SupabaseClient {
  if (!env.supabaseSecretKey) {
    throw new HttpError(503, 'Billing is not configured: set SUPABASE_SECRET_KEY in server/.env');
  }
  adminClient ??= createClient(env.supabaseUrl, env.supabaseSecretKey, { auth: SERVER_AUTH_OPTIONS });
  return adminClient;
}
