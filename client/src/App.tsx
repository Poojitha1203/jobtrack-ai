import { RouterProvider } from 'react-router/dom';
import { router } from './router.tsx';
import { AuthProvider } from './context/AuthProvider.tsx';
import { isSupabaseConfigured } from './lib/supabase.ts';
import { SetupRequiredPage } from './pages/SetupRequiredPage.tsx';

// Root component: auth state wraps the router so every page can call useAuth().
export default function App() {
  if (!isSupabaseConfigured) return <SetupRequiredPage />;

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
