import { useId, type SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/cn.ts';
import { inputClasses } from '../../lib/formStyles.ts';

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  /** Visually hide the label (it stays available to screen readers). */
  hideLabel?: boolean;
}

export function SelectField({ label, error, hint, hideLabel, id, className, children, ...props }: SelectFieldProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const messageId = `${selectId}-message`;
  const message = error ?? hint;

  return (
    <div className={className}>
      <label htmlFor={selectId} className={cn('block text-sm font-medium text-slate-700', hideLabel && 'sr-only')}>
        {label}
      </label>
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        className={inputClasses(Boolean(error), cn('pr-8', !hideLabel && 'mt-1.5'))}
        {...props}
      >
        {children}
      </select>
      {message && (
        <p id={messageId} className={cn('mt-1.5 text-xs', error ? 'text-rose-600' : 'text-slate-500')}>
          {message}
        </p>
      )}
    </div>
  );
}
