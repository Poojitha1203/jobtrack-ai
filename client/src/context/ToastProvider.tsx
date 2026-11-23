import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { CircleAlert, CircleCheck, Info, X, type LucideIcon } from 'lucide-react';
import { ToastContext, type ToastTone } from './toastContext.ts';
import { cn } from '../lib/cn.ts';

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

const TONES: Record<ToastTone, { icon: LucideIcon; iconClass: string }> = {
  success: { icon: CircleCheck, iconClass: 'text-emerald-600' },
  error: { icon: CircleAlert, iconClass: 'text-rose-600' },
  info: { icon: Info, iconClass: 'text-sky-600' },
};

const AUTO_DISMISS_MS = 4000;
const MAX_VISIBLE = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), []);

  const showToast = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      nextId.current += 1;
      const id = nextId.current;
      setToasts((all) => [...all.slice(-(MAX_VISIBLE - 1)), { id, message, tone }]);
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6"
      >
        {toasts.map((toast) => {
          const { icon: Icon, iconClass } = TONES[toast.tone];
          return (
            <div
              key={toast.id}
              role={toast.tone === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-lg sm:w-96"
            >
              <Icon className={cn('mt-0.5 size-4 shrink-0', iconClass)} aria-hidden="true" />
              <p className="min-w-0 flex-1">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="-m-1 rounded p-1 text-slate-400 hover:text-slate-600"
                aria-label="Dismiss notification"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
