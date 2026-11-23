import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/** False until client/.env has the Supabase URL and publishable key. */
export const isSupabaseConfigured = Boolean(url && publishableKey);

// The single Supabase client for the browser.
//  - persistSession: keeps the user logged in across page reloads (localStorage)
//  - autoRefreshToken: renews the short-lived access token automatically
//  - detectSessionInUrl: reads the tokens from email links (e.g. password reset)
// Placeholder values stop the app crashing when env vars are missing;
// App.tsx shows setup instructions instead in that case.
export const supabase = createClient(
  url || 'http://localhost:54321',
  publishableKey || 'missing-publishable-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
