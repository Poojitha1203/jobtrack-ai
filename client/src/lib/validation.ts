// Client-side form checks. They give instant feedback; the server and
// Supabase still validate everything again (never trust the browser alone).

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_HINT = 'At least 8 characters, including a letter and a number.';

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return 'Email is required';
  if (!EMAIL_PATTERN.test(email.trim())) return 'Enter a valid email address';
  return undefined;
}

export function validateNewPassword(password: string): string | undefined {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Use at least 8 characters';
  if (!/[a-z]/i.test(password) || !/\d/.test(password)) return 'Include at least one letter and one number';
  return undefined;
}

export function validatePasswordConfirmation(password: string, confirm: string): string | undefined {
  if (!confirm) return 'Please confirm your password';
  if (password !== confirm) return "Passwords don't match";
  return undefined;
}

/** True when an errors object has no messages. */
export const hasNoErrors = (errors: Record<string, string | undefined>) =>
  Object.values(errors).every((message) => !message);
