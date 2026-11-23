import type { LucideIcon } from 'lucide-react';
import { Card } from '../ui/Card.tsx';
import { cn } from '../../lib/cn.ts';

export type StatAccent = 'brand' | 'violet' | 'emerald' | 'sky';

const ACCENTS: Record<StatAccent, string> = {
  brand: 'bg-brand-50 text-brand-600',
  violet: 'bg-violet-50 text-violet-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  sky: 'bg-sky-50 text-sky-600',
};

interface StatCardProps {
  label: string;
  value: string | number;
  /** Short supporting line under the number. */
  hint: string;
  icon: LucideIcon;
  accent?: StatAccent;
}

export function StatCard({ label, value, hint, icon: Icon, accent = 'brand' }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={cn('flex size-9 items-center justify-center rounded-lg', ACCENTS[accent])}>
          <Icon className="size-[18px]" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </Card>
  );
}
