import { useContext } from 'react';
import { AuthContext } from '../context/authContext.ts';

/** Access the logged-in user, their profile and auth actions from any component. */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
