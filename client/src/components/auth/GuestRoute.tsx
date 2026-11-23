import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../hooks/useAuth.ts';
import { FullPageLoader } from '../ui/FullPageLoader.tsx';

// Only accept internal paths like "/board" — never "//evil.com" or full URLs
// (prevents an "open redirect" through the login page).
const isSafeRedirect = (path: unknown): path is string =>
  typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');

// Wraps login/register/forgot-password. Logged-in users don't need these pages,
// so they're sent to where they were going (or the dashboard).
// This is also what redirects the user right after a successful login.
export function GuestRoute() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader />;

  if (session) {
    const from = (location.state as { from?: unknown } | null)?.from;
    return <Navigate to={isSafeRedirect(from) ? from : '/dashboard'} replace />;
  }

  return <Outlet />;
}
