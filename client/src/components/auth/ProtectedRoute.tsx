import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../hooks/useAuth.ts';
import { FullPageLoader } from '../ui/FullPageLoader.tsx';

// Wraps routes that require login. Logged-out visitors are sent to /login,
// remembering where they were going so we can send them back afterwards.
export function ProtectedRoute() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader label="Checking your session…" />;

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <Outlet />;
}
