// Turns Supabase Auth error codes into messages a user can act on.
// Codes reference: https://supabase.com/docs/guides/auth/debugging/error-codes

interface AuthLikeError {
  message: string;
  code?: string;
}

export function friendlyAuthError(error: AuthLikeError): string {
  switch (error.code) {
    case 'invalid_credentials':
      return 'Incorrect email or password.';
    case 'email_not_confirmed':
      return 'Please confirm your email first — check your inbox for the confirmation link.';
    case 'user_already_exists':
    case 'email_exists':
      return 'An account with this email already exists. Try logging in instead.';
    case 'weak_password':
      return 'That password is too weak. Use at least 8 characters with letters and numbers.';
    case 'same_password':
      return 'Your new password must be different from your current one.';
    case 'over_email_send_rate_limit':
      return 'Too many emails were sent recently. Please wait a while and try again.';
    case 'over_request_rate_limit':
      return 'Too many attempts. Please wait a minute and try again.';
    case 'email_address_not_authorized':
      return "Supabase's free built-in email can only send to your project team's addresses. Use your own team email for testing, or set up a free custom SMTP provider.";
    case 'signup_disabled':
      return 'New sign-ups are currently disabled.';
  }
  if (/failed to fetch|network/i.test(error.message)) {
    return 'Could not reach the authentication server. Check your internet connection.';
  }
  return error.message;
}
