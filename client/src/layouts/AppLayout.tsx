import { useEffect, useState } from 'react';
import { Outlet } from 'react-router';
import { Sidebar } from '../components/layout/Sidebar.tsx';
import { Topbar } from '../components/layout/Topbar.tsx';
import { PlanProvider } from '../context/PlanProvider.tsx';

// Shell for every signed-in page: sidebar on the left, top bar, and the page itself.
// <Outlet /> is where React Router renders the current child route (Dashboard, Applications, ...).
export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu with the Escape key.
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <PlanProvider>
      <div className="min-h-screen">
        {/* Lets keyboard users jump past the navigation. Visible only when focused. */}
        <a
          href="#main-content"
          className="sr-only z-50 rounded-md bg-white px-3 py-2 text-sm font-medium shadow focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>

        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

        <div className="lg:pl-64">
          <Topbar menuOpen={menuOpen} onMenuClick={() => setMenuOpen(true)} />
          <main id="main-content" className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </PlanProvider>
  );
}
