import type { ReactNode } from 'react';
import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn.ts';

type AlertTone = 'error' | 'success' | 'info' | 'warning';

const TONES: Record<AlertTone, { box: string; icon: LucideIcon }> = {
  error: { box: 'border-rose-200 bg-rose-50 text-rose-800', icon: CircleAlert },
  success: { box: 'border-emerald-200 bg-emerald-50 text-emerald-800', icon: CircleCheck },
  info: { box: 'border-sky-200 bg-sky-50 text-sky-800', icon: Info },
  warning: { box: 'border-amber-200 bg-amber-50 text-amber-900', icon: TriangleAlert },
};

interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children?: ReactNode;
  className?: string;
}

// Inline message box. Errors use role="alert" so screen readers announce them immediately.
export function Alert({ tone = 'info', title, children, className }: AlertProps) {
  const { box, icon: Icon } = TONES[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex gap-2.5 rounded-lg border px-4 py-3 text-sm', box, className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5', 'opacity-90')}>{children}</div>}
      </div>
    </div>
  );
}
