import type { SupabaseClient } from '@supabase/supabase-js';

// Adds our own property to Express's Request type, so `req.auth` is typed
// in every controller. It is set by the requireAuth middleware.
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        email: string;
        /** Supabase client that acts AS this user, so Row Level Security applies. */
        supabase: SupabaseClient;
      };
    }
  }
}

export {};
