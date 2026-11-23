import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { AuthLayout } from '../../layouts/AuthLayout.tsx';
import { TextField } from '../../components/ui/TextField.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Alert } from '../../components/ui/Alert.tsx';
import { supabase } from '../../lib/supabase.ts';
import { friendlyAuthError } from '../../lib/authErrors.ts';
import { validateEmail } from '../../lib/validation.ts';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.ts';

export function ForgotPasswordPage() {
  useDocumentTitle('Reset password');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const error = validateEmail(email);
    setEmailError(error);
    if (error) return;

    setSubmitting(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      // The link in the email opens this page of our app, already signed in for recovery.
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);

    if (resetError) {
      setFormError(friendlyAuthError(resetError));
      return;
    }
    // For privacy, Supabase doesn't reveal whether the email has an account,
    // so we show the same message either way.
    setSent(true);
  };

  const backToLogin = (
    <Link to="/login" className="inline-flex items-center gap-1.5 font-medium text-brand-600 hover:text-brand-700">
      <ArrowLeft className="size-4" aria-hidden="true" /> Back to log in
    </Link>
  );

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your account email and we'll send you a link to choose a new one."
      footer={backToLogin}
    >
      {sent ? (
        <Alert tone="success" title="Check your email">
          If an account exists for <strong>{email.trim()}</strong>, a password reset link is on its way.
          The link expires after a while, so use it soon.
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {formError && <Alert tone="error">{formError}</Alert>}
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
            autoFocus
          />
          <Button type="submit" loading={submitting} className="w-full">
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
