import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { AuthLayout } from '../../layouts/AuthLayout.tsx';
import { TextField } from '../../components/ui/TextField.tsx';
import { PasswordField } from '../../components/ui/PasswordField.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Alert } from '../../components/ui/Alert.tsx';
import { supabase } from '../../lib/supabase.ts';
import { friendlyAuthError } from '../../lib/authErrors.ts';
import { hasNoErrors, validateEmail } from '../../lib/validation.ts';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.ts';

interface FieldErrors {
  email?: string;
  password?: string;
}

export function LoginPage() {
  useDocumentTitle('Log in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // stop the browser's default full-page form submit
    setFormError(null);

    const errors: FieldErrors = {
      email: validateEmail(email),
      password: password ? undefined : 'Password is required',
    };
    setFieldErrors(errors);
    if (!hasNoErrors({ ...errors })) return;

    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setSubmitting(false);

    if (error) {
      setFormError(friendlyAuthError(error));
      return;
    }
    // Success: AuthProvider receives the new session and <GuestRoute>
    // redirects to the page the user wanted (or the dashboard).
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to continue your job search."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
            Sign up free
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {formError && <Alert tone="error">{formError}</Alert>}

        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          autoFocus
        />

        <div>
          <PasswordField
            label="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
          />
          <div className="mt-2 text-right">
            <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" loading={submitting} className="w-full">
          Log in
        </Button>
      </form>
    </AuthLayout>
  );
}
