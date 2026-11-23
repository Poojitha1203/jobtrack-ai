import { useState, type ChangeEvent, type FormEvent } from 'react';
import { PageHeader } from '../components/layout/PageHeader.tsx';
import { Card, CardHeader } from '../components/ui/Card.tsx';
import { TextField } from '../components/ui/TextField.tsx';
import { PasswordField } from '../components/ui/PasswordField.tsx';
import { Button } from '../components/ui/Button.tsx';
import { Alert } from '../components/ui/Alert.tsx';
import { Badge } from '../components/ui/Badge.tsx';
import { Skeleton } from '../components/ui/Skeleton.tsx';
import { useAuth } from '../hooks/useAuth.ts';
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts';
import { updateProfile } from '../services/profile.ts';
import { ApiError } from '../services/api.ts';
import { supabase } from '../lib/supabase.ts';
import { friendlyAuthError } from '../lib/authErrors.ts';
import {
  PASSWORD_HINT,
  hasNoErrors,
  validateNewPassword,
  validatePasswordConfirmation,
} from '../lib/validation.ts';
import type { Profile } from '../types/api.ts';

const memberSince = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });

type ProfileFieldErrors = Partial<Record<'fullName' | 'headline' | 'location' | 'weeklyGoal', string>>;

function ProfileForm({ profile }: { profile: Profile }) {
  const { setProfile } = useAuth();
  const [form, setForm] = useState({
    fullName: profile.fullName,
    headline: profile.headline ?? '',
    location: profile.location ?? '',
    weeklyGoal: String(profile.weeklyGoal),
  });
  const [errors, setErrors] = useState<ProfileFieldErrors>({});
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    const goal = Number(form.weeklyGoal);
    const nextErrors: ProfileFieldErrors = {
      fullName: form.fullName.trim() ? undefined : 'Name is required',
      weeklyGoal: Number.isInteger(goal) && goal >= 1 && goal <= 100 ? undefined : 'Enter a whole number from 1 to 100',
    };
    setErrors(nextErrors);
    if (!hasNoErrors(nextErrors)) return;

    setSaving(true);
    try {
      const updated = await updateProfile({
        fullName: form.fullName.trim(),
        headline: form.headline.trim() || null,
        location: form.location.trim() || null,
        weeklyGoal: goal,
      });
      setProfile(updated);
      setStatus({ tone: 'success', message: 'Profile saved.' });
    } catch (error) {
      if (error instanceof ApiError && error.details) {
        // Show the server's per-field validation messages next to the right inputs.
        setErrors(Object.fromEntries(Object.entries(error.details).map(([k, v]) => [k, v[0]])));
      }
      setStatus({ tone: 'error', message: error instanceof Error ? error.message : 'Could not save profile.' });
    } finally {
      setSaving(false);
    }
  };

  const field = (name: keyof typeof form) => ({
    value: form[name],
    onChange: (e: ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, [name]: e.target.value })),
    error: errors[name],
  });

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5 p-5">
      {status && <Alert tone={status.tone}>{status.message}</Alert>}
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Full name" autoComplete="name" maxLength={100} {...field('fullName')} />
        <TextField label="Email" value={profile.email} disabled hint="Your login email can't be changed here." />
        <TextField
          label="Headline"
          placeholder="e.g. Frontend developer · React & TypeScript"
          maxLength={150}
          {...field('headline')}
        />
        <TextField label="Location" placeholder="e.g. Bengaluru, India" maxLength={100} {...field('location')} />
        <TextField
          label="Weekly application goal"
          type="number"
          inputMode="numeric"
          min={1}
          max={100}
          hint="Shown on your dashboard."
          {...field('weeklyGoal')}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" loading={saving}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    const nextErrors = {
      password: validateNewPassword(password),
      confirmPassword: validatePasswordConfirmation(password, confirmPassword),
    };
    setErrors(nextErrors);
    if (!hasNoErrors(nextErrors)) return;

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      setStatus({ tone: 'error', message: friendlyAuthError(error) });
      return;
    }
    setPassword('');
    setConfirmPassword('');
    setStatus({ tone: 'success', message: 'Password updated.' });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5 p-5">
      {status && <Alert tone={status.tone}>{status.message}</Alert>}
      <div className="grid gap-5 sm:grid-cols-2">
        <PasswordField
          label="New password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          hint={PASSWORD_HINT}
        />
        <PasswordField
          label="Confirm new password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="secondary" loading={saving}>
          Update password
        </Button>
      </div>
    </form>
  );
}

export function SettingsPage() {
  useDocumentTitle('Settings');
  const { profile, profileLoading, profileError, refreshProfile } = useAuth();

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Settings" description="Manage your profile and account security." />

      <Card>
        <CardHeader
          title="Profile"
          description={profile ? `Member since ${memberSince.format(new Date(profile.createdAt))}` : undefined}
          action={profile?.role === 'admin' ? <Badge tone="violet">Admin</Badge> : undefined}
        />
        {profileLoading && (
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        )}
        {profileError && (
          <div className="space-y-4 p-5">
            <Alert tone="error" title="Couldn't load your profile">
              {profileError}
            </Alert>
            <Button variant="secondary" onClick={() => void refreshProfile()}>
              Try again
            </Button>
          </div>
        )}
        {/* key resets the form if a different profile loads */}
        {profile && <ProfileForm key={profile.id} profile={profile} />}
      </Card>

      <Card>
        <CardHeader title="Password" description="Choose a new password for your account." />
        <PasswordForm />
      </Card>
    </div>
  );
}
