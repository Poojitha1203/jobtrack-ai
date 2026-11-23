import { BriefcaseBusiness } from 'lucide-react';
import { cn } from '../../lib/cn.ts';

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm">
        <BriefcaseBusiness className="size-[18px]" aria-hidden="true" />
      </span>
      <span className="text-base font-semibold tracking-tight text-slate-900">
        JobTrack <span className="text-brand-600">AI</span>
      </span>
    </span>
  );
}
