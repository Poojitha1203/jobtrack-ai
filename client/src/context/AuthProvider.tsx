import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase.ts';
import { fetchProfile } from '../services/profile.ts';
import type { Profile } from '../types/api.ts';
import { AuthContext, type AuthContextValue } from './authContext.ts';

interface ProfileState {
  /** Which user this profile result belongs to (guards against stale data after logout/login). */
  userId: string;
  profile: Profile | null;
  error: string | null;
}

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Could not load your profile';

// Makes the logged-in user available to every component via useAuth().
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileState, setProfileState] = useState<ProfileState | null>(null);

  // Supabase calls this immediately with the current session (INITIAL_SESSION),
  // then again on every login, logout, token refresh or password-recovery link.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // Only set state here: Supabase advises against awaiting other
      // Supabase calls inside this callback.
      setSession(newSession);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id ?? null;

  // Load the profile whenever a different user logs in.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchProfile()
      .then((profile) => {
        if (!cancelled) setProfileState({ userId, profile, error: null });
      })
      .catch((error: unknown) => {
        if (!cancelled) setProfileState({ userId, profile: null, error: errorMessage(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const refreshProfile = useCallback(async () => {
    if (!userId) return;
    try {
      const profile = await fetchProfile();
      setProfileState({ userId, profile, error: null });
    } catch (error) {
      setProfileState({ userId, profile: null, error: errorMessage(error) });
    }
  }, [userId]);

  const setProfile = useCallback(
    (profile: Profile) => setProfileState({ userId: profile.id, profile, error: null }),
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  // Ignore a cached profile that belongs to a previous user.
  const current = profileState && profileState.userId === userId ? profileState : null;

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile: current?.profile ?? null,
      loading,
      profileLoading: Boolean(userId) && !current,
      profileError: current?.error ?? null,
      refreshProfile,
      setProfile,
      signOut,
    }),
    [session, current, loading, userId, refreshProfile, setProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
