import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';

// The white rounded panel used for almost every block of content.
export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn('rounded-xl border border-slate-200 bg-white shadow-sm', className)}
      {...props}
    />
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  /** Optional element on the right, e.g. a "View all" link. */
  action?: ReactNode;
}

export function CardHeader({ title, description, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 pt-5">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
