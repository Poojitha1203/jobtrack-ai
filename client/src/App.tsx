import { RouterProvider } from 'react-router/dom';
import { router } from './router.tsx';
import { AuthProvider } from './context/AuthProvider.tsx';
import { ToastProvider } from './context/ToastProvider.tsx';
import { isSupabaseConfigured } from './lib/supabase.ts';
import { SetupRequiredPage } from './pages/SetupRequiredPage.tsx';

export default function App() {
  if (!isSupabaseConfigured) return <SetupRequiredPage />;

  return (
    <AuthProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AuthProvider>
  );
}
