import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Sparkles } from 'lucide-react';
import { buttonClasses } from '../../lib/buttonStyles.ts';

export function UpgradeBanner({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 sm:flex-row sm:items-center">
      <Sparkles className="size-5 shrink-0 text-brand-600" aria-hidden="true" />
      <p className="flex-1 text-sm text-brand-900">{children}</p>
      <Link to="/subscription" className={buttonClasses({ size: 'sm' })}>
        See Pro
      </Link>
    </div>
  );
}
