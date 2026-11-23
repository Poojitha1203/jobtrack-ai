import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Bell, Check } from 'lucide-react';
import { useAsyncData } from '../../hooks/useAsyncData.ts';
import { useToast } from '../../hooks/useToast.ts';
import { listReminders, onRemindersChanged, updateReminder } from '../../services/reminders.ts';
import { addDays, formatRelativeDay, formatTime, startOfDay } from '../../lib/date.ts';
import { buttonClasses } from '../../lib/buttonStyles.ts';
import { cn } from '../../lib/cn.ts';

const REFRESH_MS = 60_000;

// In-app notifications: reminders that are due now, plus the rest of today's.
export function NotificationsMenu() {
  const showToast = useToast();
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, reload } = useAsyncData(
    () => listReminders({ status: 'open', to: addDays(startOfDay(new Date()), 1).toISOString(), order: 'asc', limit: 50 }),
    'notifications',
  );

  useEffect(() => {
    const refresh = () => {
      setNow(Date.now());
      reload();
    };
    const unsubscribe = onRemindersChanged(refresh);
    const interval = window.setInterval(refresh, REFRESH_MS);
    window.addEventListener('focus', refresh);
    return () => {
      unsubscribe();
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
    };
  }, [reload]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const reminders = data ?? [];
  const dueCount = reminders.filter((r) => new Date(r.remindAt).getTime() <= now).length;

  const markDone = async (id: string) => {
    try {
      await updateReminder(id, { isCompleted: true });
      showToast('Reminder marked as done');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not update the reminder', 'error');
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={buttonClasses({ variant: 'ghost', size: 'icon', className: 'relative' })}
        aria-expanded={open}
        aria-controls="notifications-menu"
        aria-label={dueCount > 0 ? `Notifications: ${dueCount} reminder${dueCount === 1 ? '' : 's'} due` : 'Notifications'}
      >
        <Bell className="size-5" aria-hidden="true" />
        {dueCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] leading-4 font-semibold text-white">
            {dueCount > 9 ? '9+' : dueCount}
          </span>
        )}
      </button>

      {open && (
        <div
          id="notifications-menu"
          className="absolute right-0 z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Today&apos;s reminders</p>
            {dueCount > 0 && <span className="text-xs font-medium text-rose-600">{dueCount} due</span>}
          </div>

          {reminders.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">You&apos;re all caught up 🎉</p>
          ) : (
            <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
              {reminders.map((r) => {
                const at = new Date(r.remindAt);
                const due = at.getTime() <= now;
                return (
                  <li key={r.id} className="flex items-start gap-3 px-4 py-3">
                    <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', due ? 'bg-rose-500' : 'bg-slate-300')} aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium break-words text-slate-900">{r.title}</p>
                      <p className={cn('text-xs', due ? 'text-rose-600' : 'text-slate-500')}>
                        {due ? 'Due' : 'Later'} · {formatRelativeDay(at)} at {formatTime(at)}
                        {r.application && ` · ${r.application.company.name}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void markDone(r.id)}
                      className={buttonClasses({ variant: 'ghost', size: 'icon', className: 'size-8 hover:text-emerald-600' })}
                      aria-label={`Mark "${r.title}" as done`}
                    >
                      <Check className="size-4" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <Link
            to="/reminders"
            onClick={() => setOpen(false)}
            className="block border-t border-slate-100 px-4 py-2.5 text-center text-sm font-medium text-brand-600 hover:bg-slate-50"
          >
            View all reminders
          </Link>
        </div>
      )}
    </div>
  );
}
