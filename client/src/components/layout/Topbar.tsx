import { useLocation } from 'react-router';
import { Menu } from 'lucide-react';
import { findNavItem } from '../../config/navigation.ts';
import { buttonClasses } from '../../lib/buttonStyles.ts';
import { Badge } from '../ui/Badge.tsx';

interface TopbarProps {
  menuOpen: boolean;
  onMenuClick: () => void;
}

export function Topbar({ menuOpen, onMenuClick }: TopbarProps) {
  const { pathname } = useLocation();
  const current = findNavItem(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onMenuClick}
        className={buttonClasses({ variant: 'ghost', size: 'icon', className: '-ml-2 lg:hidden' })}
        aria-label="Open menu"
        aria-expanded={menuOpen}
        aria-controls="app-sidebar"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      <p className="truncate text-sm font-medium text-slate-500">{current?.label ?? 'JobTrack AI'}</p>

      <div className="ml-auto flex items-center gap-3">
        {/* Replaced with the signed-in user's menu in Phase 3. */}
        {/* Wrapper controls visibility; putting `hidden` on the Badge itself would clash
            with the Badge's own `inline-flex` class. */}
        <span className="hidden sm:block">
          <Badge tone="warning">Demo mode</Badge>
        </span>
        <span
          className="flex size-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700"
          aria-label="Demo user"
          role="img"
        >
          DU
        </span>
      </div>
    </header>
  );
}
