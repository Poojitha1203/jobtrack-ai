import type { ReactNode } from 'react';
import { createBrowserRouter } from 'react-router';
import { AppLayout } from './layouts/AppLayout.tsx';
import { ProtectedRoute } from './components/auth/ProtectedRoute.tsx';
import { GuestRoute } from './components/auth/GuestRoute.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { LoginPage } from './pages/auth/LoginPage.tsx';
import { RegisterPage } from './pages/auth/RegisterPage.tsx';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage.tsx';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { ApplicationsPage } from './pages/ApplicationsPage.tsx';
import { ApplicationDetailsPage } from './pages/ApplicationDetailsPage.tsx';
import { KanbanPage } from './pages/KanbanPage.tsx';
import { ComingSoonPage } from './pages/ComingSoonPage.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';
import { NAV_ITEMS } from './config/navigation.ts';

// Pages that exist so far. Every other sidebar entry gets a "coming soon" placeholder.
const BUILT_PAGES: Record<string, ReactNode> = {
  '/dashboard': <DashboardPage />,
  '/settings': <SettingsPage />,
  '/applications': <ApplicationsPage />,
  '/board': <KanbanPage />,
};

export const router = createBrowserRouter([
  // Public
  { path: '/', element: <LandingPage /> },

  // Only for logged-OUT visitors (logged-in users are redirected to the app)
  {
    element: <GuestRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
    ],
  },

  // Reached from the password-reset email (the link signs the user in temporarily)
  { path: '/reset-password', element: <ResetPasswordPage /> },

  // Only for logged-IN users
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          ...NAV_ITEMS.map((item) => ({
            path: item.path,
            element: BUILT_PAGES[item.path] ?? <ComingSoonPage item={item} />,
          })),
          { path: '/applications/:id', element: <ApplicationDetailsPage /> },
        ],
      },
    ],
  },

  { path: '*', element: <NotFoundPage /> },
]);
