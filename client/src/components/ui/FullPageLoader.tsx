import { Loader2 } from 'lucide-react';

// Shown while we check whether the user is logged in.
export function FullPageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-slate-500" role="status">
      <Loader2 className="size-7 animate-spin text-brand-600" aria-hidden="true" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
