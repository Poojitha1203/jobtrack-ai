import { useState } from 'react';
import { Link } from 'react-router';
import { Check, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '../ui/Badge.tsx';
import { buttonClasses } from '../../lib/buttonStyles.ts';
import { cn } from '../../lib/cn.ts';
import { formatRelativeDay, formatTime } from '../../lib/date.ts';
import { REMINDER_TYPE_META } from '../../lib/reminderOptions.ts';
import type { Reminder } from '../../types/reminder.ts';

interface ReminderListProps {
  reminders: Reminder[];
  onToggleComplete: (reminder: Reminder) => void;
  onEdit: (reminder: Reminder) => void;
  onDelete: (reminder: Reminder) => void;
}

export function ReminderList({ reminders, onToggleComplete, onEdit, onDelete }: ReminderListProps) {
  const [now] = useState(() => Date.now());

  return (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
      {reminders.map((reminder) => {
        const at = new Date(reminder.remindAt);
        const overdue = !reminder.isCompleted && at.getTime() <= now;
        const type = REMINDER_TYPE_META[reminder.type];
        return (
          <li key={reminder.id} className="flex items-start gap-3 p-4">
            <button
              type="button"
              role="checkbox"
              aria-checked={reminder.isCompleted}
              aria-label={reminder.isCompleted ? `Mark "${reminder.title}" as not done` : `Mark "${reminder.title}" as done`}
              onClick={() => onToggleComplete(reminder)}
              className={cn(
                'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                reminder.isCompleted
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-slate-300 text-transparent hover:border-brand-500 hover:text-brand-500',
              )}
            >
              <Check className="size-3" strokeWidth={3} aria-hidden="true" />
            </button>

            <div className="min-w-0 flex-1">
              <p className={cn('text-sm font-medium break-words', reminder.isCompleted ? 'text-slate-400 line-through' : 'text-slate-900')}>
                {reminder.title}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span className={cn('font-medium', overdue && 'text-rose-600')}>
                  {overdue && 'Overdue · '}
                  {formatRelativeDay(at)} at {formatTime(at)}
                </span>
                <Badge tone={type.tone}>
                  <type.icon className="size-3" aria-hidden="true" /> {type.label}
                </Badge>
                {reminder.application && (
                  <Link to={`/applications/${reminder.application.id}`} className="truncate hover:text-brand-700 hover:underline">
                    {reminder.application.company.name} — {reminder.application.jobTitle}
                  </Link>
                )}
              </p>
              {reminder.notes && <p className="mt-1.5 line-clamp-2 text-sm text-slate-600">{reminder.notes}</p>}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => onEdit(reminder)}
                className={buttonClasses({ variant: 'ghost', size: 'icon', className: 'size-8' })}
                aria-label={`Edit "${reminder.title}"`}
              >
                <Pencil className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(reminder)}
                className={buttonClasses({ variant: 'ghost', size: 'icon', className: 'size-8 hover:bg-rose-50 hover:text-rose-600' })}
                aria-label={`Delete "${reminder.title}"`}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
