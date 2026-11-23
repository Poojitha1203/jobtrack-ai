import { cn } from './cn.ts';

// Shared look for text inputs, selects and textareas.
export function inputClasses(hasError = false, className?: string) {
  return cn(
    'block w-full rounded-lg border-0 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm',
    'ring-1 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:outline-none',
    'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
    hasError ? 'ring-rose-400 focus:ring-rose-500' : 'ring-slate-300 focus:ring-brand-600',
    className,
  );
}
