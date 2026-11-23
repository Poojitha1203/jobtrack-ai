import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { AuthLayout } from '../../layouts/AuthLayout.tsx';
import { PasswordField } from '../../components/ui/PasswordField.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Alert } from '../../components/ui/Alert.tsx';
import { FullPageLoader } from '../../components/ui/FullPageLoader.tsx';
import { supabase } from '../../lib/supabase.ts';
import { friendlyAuthError } from '../../lib/authErrors.ts';
import { buttonClasses } from '../../lib/buttonStyles.ts';
import {
  PASSWORD_HINT,
  hasNoErrors,
  validateNewPassword,
  validatePasswordConfirmation,
} from '../../lib/validation.ts';
import { useAuth } from '../../hooks/useAuth.ts';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.ts';

// If the email link was expired or already used, Supabase redirects here with
// "#error_description=..." in the URL instead of a session.
function readLinkError(): string | null {
  const params = new URLSearchParams(window.location.hash.slice(1));
  return params.get('error_description');
}

export function ResetPasswordPage() {
  useDocumentTitle('Choose a new password');
  const { session, loading } = useAuth();
  const [linkError] = useState(readLinkError);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (loading) return <FullPageLoader label="Verifying your reset link…" />;

  // Opening the reset link signs the user in temporarily. No session = bad or expired link.
  if (!session) {
    return (
      <AuthLayout title="Reset link not valid">
        <Alert tone="error" title="This link is invalid or has expired">
          {linkError ?? 'Password reset links can only be used once and expire after a short time.'}
        </Alert>
        <Link to="/forgot-password" className={buttonClasses({ className: 'mt-6 w-full' })}>
          Request a new link
        </Link>
      </AuthLayout>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const errors = {
      password: validateNewPassword(password),
      confirmPassword: validatePasswordConfirmation(password, confirmPassword),
    };
    setFieldErrors(errors);
    if (!hasNoErrors(errors)) return;

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      setFormError(friendlyAuthError(error));
      return;
    }
    setDone(true);
  };

  return (
    <AuthLayout title="Choose a new password" subtitle={`For ${session.user.email ?? 'your account'}`}>
      {done ? (
        <div className="space-y-6">
          <Alert tone="success" title="Password updated">
            You can now use your new password to log in.
          </Alert>
          <Link to="/dashboard" className={buttonClasses({ className: 'w-full' })}>
            Continue to dashboard
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {formError && <Alert tone="error">{formError}</Alert>}
          <PasswordField
            label="New password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            hint={PASSWORD_HINT}
            autoFocus
          />
          <PasswordField
            label="Confirm new password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={fieldErrors.confirmPassword}
          />
          <Button type="submit" loading={submitting} className="w-full">
            Update password
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
