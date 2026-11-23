import { cn } from '../../lib/cn.ts';
import { getInitials } from '../../lib/user.ts';

const PALETTE = [
  'bg-brand-100 text-brand-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-800',
  'bg-violet-100 text-violet-700',
  'bg-rose-100 text-rose-700',
];

// Same name → same colour every time.
function colorFor(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function CompanyAvatar({ name, size = 'md' }: { name: string; size?: 'md' | 'lg' }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center rounded-xl font-semibold',
        size === 'lg' ? 'size-14 text-lg' : 'size-11 text-sm',
        colorFor(name),
      )}
    >
      {getInitials(name)}
    </span>
  );
}
