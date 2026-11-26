import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../../hooks/useAuth.ts';
import { FullPageLoader } from '../ui/FullPageLoader.tsx';

// Hides admin pages from non-admins. This is only for the UI —
// the API checks the role again on every /api/admin request.
export function AdminRoute() {
  const { profile, profileLoading } = useAuth();

  if (!profile && profileLoading) return <FullPageLoader label="Checking permissions…" />;
  if (profile?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
