import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ChevronDown, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.ts';
import { getDisplayName, getInitials } from '../../lib/user.ts';

// Avatar button in the top bar that opens a small menu (Settings, Log out).
export function UserMenu() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const name = getDisplayName(profile, user);
  const email = profile?.email ?? user?.email ?? '';

  // Close when clicking outside the menu or pressing Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full p-0.5 pr-2 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-brand-600"
        aria-expanded={open}
        aria-controls="user-menu"
        aria-label={`Account menu for ${name}`}
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
          {getInitials(name)}
        </span>
        <span className="hidden max-w-36 truncate text-sm font-medium text-slate-700 sm:block">{name}</span>
        <ChevronDown className="hidden size-4 text-slate-400 sm:block" aria-hidden="true" />
      </button>

      {open && (
        <div
          id="user-menu"
          className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-medium text-slate-900">{name}</p>
            <p className="truncate text-xs text-slate-500">{email}</p>
          </div>
          <div className="p-1.5">
            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              <Settings className="size-4 text-slate-400" aria-hidden="true" /> Settings
            </Link>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="size-4" aria-hidden="true" /> Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
