import { Link, NavLink } from 'react-router';
import { Sparkles, X } from 'lucide-react';
import { ADMIN_SECTION, NAV_SECTIONS } from '../../config/navigation.ts';
import { cn } from '../../lib/cn.ts';
import { buttonClasses } from '../../lib/buttonStyles.ts';
import { Logo } from './Logo.tsx';
import { ApiStatusIndicator } from './ApiStatusIndicator.tsx';
import { usePlan } from '../../hooks/usePlan.ts';
import { useAuth } from '../../hooks/useAuth.ts';

interface SidebarProps {
  /** Only matters below the `lg` breakpoint; on desktop the sidebar is always visible. */
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { isPro } = usePlan();
  const { profile } = useAuth();
  const sections = profile?.role === 'admin' ? [...NAV_SECTIONS, ADMIN_SECTION] : NAV_SECTIONS;
  return (
    <>
      {/* Dark overlay behind the drawer on mobile. Clicking it closes the menu. */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-[1px] lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        id="app-sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white',
          'transition-transform duration-200 ease-out lg:translate-x-0',
          // When closed on mobile: slide off-screen AND make invisible, so keyboard users
          // can't tab into hidden links. `lg:visible` keeps it visible on desktop.
          open ? 'translate-x-0' : '-translate-x-full invisible lg:visible',
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-5">
          <Link to="/dashboard" onClick={onClose} aria-label="JobTrack AI dashboard">
            <Logo />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className={buttonClasses({ variant: 'ghost', size: 'icon', className: 'lg:hidden' })}
            aria-label="Close menu"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Main">
          {sections.map((section) => (
            <div key={section.title} className="mt-5 first:mt-2">
              <p className="px-3 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                {section.title}
              </p>
              <ul className="mt-2 space-y-0.5">
                {section.items.map(({ label, path, icon: Icon }) => (
                  <li key={path}>
                    <NavLink
                      to={path}
                      end={path === ADMIN_SECTION.items[0]?.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-brand-50 text-brand-700'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={cn(
                              'size-[18px] shrink-0',
                              isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600',
                            )}
                            aria-hidden="true"
                          />
                          {label}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="space-y-4 border-t border-slate-200 p-4">
          {isPro ? (
            <Link
              to="/subscription"
              onClick={onClose}
              className="flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-100"
            >
              <Sparkles className="size-4" aria-hidden="true" /> Pro plan
            </Link>
          ) : (
            <div className="rounded-xl bg-linear-to-br from-brand-600 to-brand-800 p-4 text-white">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <Sparkles className="size-4" aria-hidden="true" /> Upgrade to Pro
              </p>
              <p className="mt-1 text-xs text-brand-100">
                Unlimited applications, resume analysis and advanced analytics.
              </p>
              <Link
                to="/subscription"
                onClick={onClose}
                className="mt-3 inline-flex rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50"
              >
                View plans
              </Link>
            </div>
          )}
          <ApiStatusIndicator />
        </div>
      </aside>
    </>
  );
}
