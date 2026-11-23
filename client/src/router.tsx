import type { ReactNode } from 'react';
import { createBrowserRouter } from 'react-router';
import { AppLayout } from './layouts/AppLayout.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { ComingSoonPage } from './pages/ComingSoonPage.tsx';
import { AuthPlaceholderPage } from './pages/AuthPlaceholderPage.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';
import { NAV_ITEMS } from './config/navigation.ts';

// Pages that exist so far. Every other sidebar entry gets a "coming soon" placeholder.
const BUILT_PAGES: Record<string, ReactNode> = {
  '/dashboard': <DashboardPage />,
};

export const router = createBrowserRouter([
  // Public pages (no sidebar)
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <AuthPlaceholderPage mode="login" /> },
  { path: '/register', element: <AuthPlaceholderPage mode="register" /> },

  // App pages: rendered inside AppLayout's <Outlet />.
  // Phase 3 wraps this group in a "protected route" that requires login.
  {
    element: <AppLayout />,
    children: NAV_ITEMS.map((item) => ({
      path: item.path,
      element: BUILT_PAGES[item.path] ?? <ComingSoonPage item={item} />,
    })),
  },

  { path: '*', element: <NotFoundPage /> },
]);
