import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '../types/api.ts';

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  /** Row from the profiles table (loaded from our API after login). */
  profile: Profile | null;
  /** True until Supabase has told us whether someone is logged in. */
  loading: boolean;
  profileLoading: boolean;
  profileError: string | null;
  refreshProfile: () => Promise<void>;
  /** Replace the cached profile after a successful update. */
  setProfile: (profile: Profile) => void;
  signOut: () => Promise<void>;
}

// Kept in its own file so AuthProvider.tsx only exports a component
// (needed for React Fast Refresh to work reliably).
export const AuthContext = createContext<AuthContextValue | null>(null);
