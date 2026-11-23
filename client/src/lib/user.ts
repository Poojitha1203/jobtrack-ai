import type { User } from '@supabase/supabase-js';
import type { Profile } from '../types/api.ts';

/** Best available name: profile name → name given at sign-up → email. */
export function getDisplayName(profile: Profile | null, user: User | null): string {
  const metadataName = user?.user_metadata?.full_name;
  return (
    profile?.fullName ||
    (typeof metadataName === 'string' ? metadataName : '') ||
    profile?.email ||
    user?.email ||
    'there'
  );
}

/** "Priya Sharma" → "PS", "alex@mail.com" → "A" */
export function getInitials(name: string): string {
  const words = name.replace(/@.*/, '').trim().split(/\s+/).filter(Boolean);
  const initials = words.slice(0, 2).map((word) => word.charAt(0).toUpperCase());
  return initials.join('') || '?';
}
