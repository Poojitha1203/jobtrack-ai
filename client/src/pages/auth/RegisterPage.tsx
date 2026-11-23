import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router';
import { MailCheck } from 'lucide-react';
import { AuthLayout } from '../../layouts/AuthLayout.tsx';
import { TextField } from '../../components/ui/TextField.tsx';
import { PasswordField } from '../../components/ui/PasswordField.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Alert } from '../../components/ui/Alert.tsx';
import { EmptyState } from '../../components/ui/EmptyState.tsx';
import { supabase } from '../../lib/supabase.ts';
import { friendlyAuthError } from '../../lib/authErrors.ts';
import {
  PASSWORD_HINT,
  hasNoErrors,
  validateEmail,
  validateNewPassword,
  validatePasswordConfirmation,
} from '../../lib/validation.ts';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.ts';

interface FieldErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function RegisterPage() {
  useDocumentTitle('Create account');
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  /** Set when Supabase requires email confirmation before the first login. */
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null);

  const update = (field: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const fullName = form.fullName.trim();
    const errors: FieldErrors = {
      fullName: !fullName ? 'Name is required' : fullName.length > 100 ? 'Use 100 characters or fewer' : undefined,
      email: validateEmail(form.email),
      password: validateNewPassword(form.password),
      confirmPassword: validatePasswordConfirmation(form.password, form.confirmPassword),
    };
    setFieldErrors(errors);
    if (!hasNoErrors({ ...errors })) return;

    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        // Saved in auth.users.raw_user_meta_data; our database trigger copies it into profiles.
        data: { full_name: fullName },
        // Where the confirmation email link should land.
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    setSubmitting(false);

    if (error) {
      setFormError(friendlyAuthError(error));
      return;
    }

    // With "Confirm email" OFF, Supabase logs the user in immediately (session exists)
    // and <GuestRoute> redirects to the dashboard. With it ON, there's no session yet.
    if (!data.session) setConfirmationSentTo(form.email.trim());
  };

  if (confirmationSentTo) {
    return (
      <AuthLayout title="Check your inbox">
        <EmptyState
          icon={MailCheck}
          title="Confirm your email"
          description={
            <>
              We sent a confirmation link to <strong className="text-slate-700">{confirmationSentTo}</strong>.
              Click it to activate your account, then log in.
            </>
          }
          action={
            <Link to="/login" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              Back to log in
            </Link>
          }
          className="px-0"
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Free forever for basic tracking. No credit card required."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {formError && <Alert tone="error">{formError}</Alert>}

        <TextField
          label="Full name"
          autoComplete="name"
          value={form.fullName}
          onChange={update('fullName')}
          error={fieldErrors.fullName}
          autoFocus
        />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={update('email')}
          error={fieldErrors.email}
        />
        <PasswordField
          label="Password"
          autoComplete="new-password"
          value={form.password}
          onChange={update('password')}
          error={fieldErrors.password}
          hint={PASSWORD_HINT}
        />
        <PasswordField
          label="Confirm password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={update('confirmPassword')}
          error={fieldErrors.confirmPassword}
        />

        <Button type="submit" loading={submitting} className="w-full">
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
