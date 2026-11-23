import { cn } from '../../lib/cn.ts';

// Grey pulsing placeholder shown while data loads.
// Size it with classes: <Skeleton className="h-4 w-32" />
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-md bg-slate-200', className)} />;
}
