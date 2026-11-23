import { useLocation } from 'react-router';
import { Menu } from 'lucide-react';
import { findNavItem } from '../../config/navigation.ts';
import { buttonClasses } from '../../lib/buttonStyles.ts';
import { UserMenu } from './UserMenu.tsx';
import { NotificationsMenu } from './NotificationsMenu.tsx';

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

      <div className="ml-auto flex items-center gap-2">
        <NotificationsMenu />
        <UserMenu />
      </div>
    </header>
  );
}
